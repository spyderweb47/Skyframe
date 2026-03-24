"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { EventData, DataServer } from "@/lib/types";
import { formatYear } from "@/lib/geo";

mapboxgl.accessToken = "pk.eyJ1Ijoic3B5ZGVyd2ViIiwiYSI6ImNtbjQxMW95bDE1b2EycXNnYXpuNGhmeXIifQ.R9g4X7IFuv8WbrQbg2kccw";

/** Bounds snapshot used for caching / skip-fetch logic */
interface FetchedRegion {
    north: number;
    south: number;
    east: number;
    west: number;
    yearStart: number;
    yearEnd: number;
    zoom: number;
}

/**
 * Check whether we can skip fetching.
 * Skip only when the new viewport is geographically contained in the
 * previously fetched area AND the zoom level hasn't increased by more
 * than 0.5 (zooming in needs denser data).
 */
function canSkipFetch(current: FetchedRegion, last: FetchedRegion): boolean {
    // If user zoomed in significantly, always refetch for higher-density data
    if (current.zoom - last.zoom > 0.5) return false;

    return (
        current.north <= last.north &&
        current.south >= last.south &&
        current.east <= last.east &&
        current.west >= last.west &&
        current.yearStart >= last.yearStart &&
        current.yearEnd <= last.yearEnd
    );
}

/** Expand bounds by a relative buffer (e.g. 0.2 = 20%) */
function bufferBounds(
    north: number,
    south: number,
    east: number,
    west: number,
    factor: number
) {
    const latSpan = north - south;
    const lngSpan = east - west;
    const latBuf = latSpan * factor;
    const lngBuf = lngSpan * factor;
    return {
        north: Math.min(north + latBuf, 90),
        south: Math.max(south - latBuf, -90),
        east: Math.min(east + lngBuf, 180),
        west: Math.max(west - lngBuf, -180),
    };
}

interface MapViewProps {
    yearStart: number;
    yearEnd: number;
    servers: DataServer[];
    onLocationClick: (lat: number, lng: number) => void;
    onEventClick: (event: EventData) => void;
    refreshKey: number;
}

export default function MapView({
    yearStart,
    yearEnd,
    servers,
    onLocationClick,
    onEventClick,
    refreshKey,
}: MapViewProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const fetchIdRef = useRef(0);
    const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const [loading, setLoading] = useState(false);

    // AbortController per server so each server's in-flight request can be cancelled independently
    const abortControllers = useRef<Record<string, AbortController>>({});

    // Track the last-fetched region per server for skip-fetch logic
    const lastFetchedRegion = useRef<Record<string, FetchedRegion>>({});

    // Initialize Mapbox map once
    useEffect(() => {
        if (!mapContainer.current || mapRef.current) return;

        const map = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/dark-v11",
            center: [10, 25],
            zoom: 3,
            minZoom: 2,
            maxZoom: 18,
            attributionControl: false,
        });

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

        map.on("click", (e) => {
            if (e.originalEvent.target && (e.originalEvent.target as HTMLElement).closest(".mapboxgl-marker")) {
                return;
            }
            onLocationClick(e.lngLat.lat, e.lngLat.lng);
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Build query params from current map state, with optional buffered bounds
    const getParams = useCallback((useBuffer: boolean = true) => {
        if (!mapRef.current) return null;
        const bounds = mapRef.current.getBounds();
        if (!bounds) return null;

        const zoom = mapRef.current.getZoom();
        const midYear = Math.round((yearStart + yearEnd) / 2);
        const yearRange = Math.round((yearEnd - yearStart) / 2);

        let north = bounds.getNorth();
        let south = bounds.getSouth();
        let east = bounds.getEast();
        let west = bounds.getWest();

        // Expand bounds by 20% buffer so small pans reuse cached data
        if (useBuffer) {
            const buffered = bufferBounds(north, south, east, west, 0.2);
            north = buffered.north;
            south = buffered.south;
            east = buffered.east;
            west = buffered.west;
        }

        return {
            params: new URLSearchParams({
                north: north.toString(),
                south: south.toString(),
                east: east.toString(),
                west: west.toString(),
                year: midYear.toString(),
                yearRange: yearRange.toString(),
                zoom: Math.round(zoom).toString(),
            }),
            region: {
                north,
                south,
                east,
                west,
                yearStart,
                yearEnd,
                zoom,
            } as FetchedRegion,
        };
    }, [yearStart, yearEnd]);

    // Clear markers for a specific server
    const clearServerMarkers = useCallback((serverId: string) => {
        const className = `marker-server-${serverId}`;
        markersRef.current = markersRef.current.filter((marker) => {
            if (!marker.getElement().classList.contains(className)) return true;
            marker.remove();
            return false;
        });
    }, []);

    // Fetch events from a single server & plot them
    const fetchFromServer = useCallback(async (server: DataServer, force: boolean = false) => {
        if (!mapRef.current || !server.enabled) return;

        const result = getParams();
        if (!result) return;

        const { params, region } = result;

        // Skip-fetch: if the current viewport is inside the last-fetched region
        // AND zoom hasn't increased significantly, skip the fetch
        if (!force) {
            const lastRegion = lastFetchedRegion.current[server.id];
            if (lastRegion) {
                const rawBounds = mapRef.current.getBounds();
                const currentZoom = mapRef.current.getZoom();
                if (rawBounds) {
                    const currentRegion: FetchedRegion = {
                        north: rawBounds.getNorth(),
                        south: rawBounds.getSouth(),
                        east: rawBounds.getEast(),
                        west: rawBounds.getWest(),
                        yearStart,
                        yearEnd,
                        zoom: currentZoom,
                    };
                    if (canSkipFetch(currentRegion, lastRegion)) {
                        return; // Still within previously fetched area at similar zoom — skip
                    }
                }
            }
        }

        // Abort any previous in-flight request for this server
        if (abortControllers.current[server.id]) {
            abortControllers.current[server.id].abort();
        }
        const controller = new AbortController();
        abortControllers.current[server.id] = controller;

        const currentFetchId = ++fetchIdRef.current;

        // Determine the fetch URL
        let fetchUrl: string;
        if (server.builtin) {
            fetchUrl = `${server.url}?${params}`;
        } else {
            params.set("target", server.url);
            fetchUrl = `/api/server-proxy?${params}`;
        }

        try {
            if (server.id === "local") setLoading(true);

            const res = await fetch(fetchUrl, { signal: controller.signal });
            if (!res.ok) {
                // For non-local servers, fail silently (e.g. Wikidata timeouts are expected)
                if (server.id !== "local") {
                    console.warn(`${server.name}: returned ${res.status}, skipping`);
                    if (server.id === "local") setLoading(false);
                    return;
                }
                throw new Error(`Server ${server.name} returned ${res.status}`);
            }
            const data = await res.json();

            // Stale check
            if (!mapRef.current) return;

            // Save the fetched region for skip-fetch logic
            lastFetchedRegion.current[server.id] = region;

            // Clear old markers from this server
            clearServerMarkers(server.id);

            const events = data.events || [];
            events.forEach((event: any) => {
                const lng = Number(event.longitude);
                const lat = Number(event.latitude);
                if (isNaN(lng) || isNaN(lat)) return;
                if (!mapRef.current) return;

                // Tag event with server info
                event.serverId = server.id;
                if (server.id === "wikidata") event.isWikipedia = true;

                const el = document.createElement("div");
                el.className = `marker-pin marker-server-${server.id}`;

                if (server.id === "wikidata") {
                    el.innerHTML = `
                        <div class="flex items-center justify-center w-6 h-6 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)] font-serif text-[11px] font-bold border-2 border-[#191919] transition-transform hover:scale-110"
                             style="background-color:${server.color};color:#202122;">
                            ${server.icon}
                        </div>
                    `;
                } else if (server.id === "local") {
                    const isPrivate = event.visibility === "private";
                    el.classList.add(isPrivate ? "marker-private" : "marker-public");
                    el.innerHTML = `
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" opacity="0.9"/>
                            <circle cx="12" cy="9" r="2.5" fill="${isPrivate ? '#141420' : '#06060c'}"/>
                        </svg>
                    `;
                } else {
                    el.innerHTML = `
                        <div class="flex items-center justify-center w-7 h-7 rounded-full shadow-lg text-[11px] font-bold border-2 border-[#191919] transition-transform hover:scale-110"
                             style="background-color:${server.color};color:#fff;">
                            ${server.icon}
                        </div>
                    `;
                }

                el.addEventListener("click", (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onEventClick(event);
                });

                let marker: mapboxgl.Marker;
                if (server.id !== "wikidata") {
                    const popupHTML = `
                        <div class="event-popup p-3 rounded-lg bg-[#191919] border border-[#2f2f2f] shadow-sm">
                            <h3 class="popup-title text-gray-100 font-bold text-sm mb-1">${event.title}</h3>
                            <p class="popup-year text-xs font-medium text-gray-400 mb-1.5">${formatYear(event.year)}</p>
                            <p class="popup-desc text-xs text-gray-500 leading-relaxed">
                                ${(event.description || "").substring(0, 140)}${(event.description || "").length > 140 ? "..." : ""}
                            </p>
                            ${event.user ? `<p class="popup-author text-[10px] text-gray-400 mt-2 font-medium">By ${event.user.name}</p>` : ""}
                        </div>
                    `;
                    const popup = new mapboxgl.Popup({
                        offset: 25,
                        closeButton: false,
                        closeOnClick: true,
                        className: "dark-popup"
                    }).setHTML(popupHTML);

                    marker = new mapboxgl.Marker({ element: el })
                        .setLngLat([lng, lat])
                        .setPopup(popup)
                        .addTo(mapRef.current!);
                } else {
                    marker = new mapboxgl.Marker({ element: el })
                        .setLngLat([lng, lat])
                        .addTo(mapRef.current!);
                }

                markersRef.current.push(marker);
            });

            if (server.id === "local") setLoading(false);
        } catch (error: any) {
            // Don't log AbortError — it's expected when we cancel stale requests
            if (error?.name === "AbortError") return;
            console.error(`${server.name} fetch error:`, error);
            if (server.id === "local") setLoading(false);
        }
    }, [yearStart, yearEnd, getParams, clearServerMarkers, onEventClick]);

    // Trigger fetches for all enabled servers
    const fetchAllServers = useCallback((force: boolean = false) => {
        // Clear all timers
        Object.values(debounceTimers.current).forEach(clearTimeout);
        debounceTimers.current = {};

        servers.forEach((server) => {
            if (!server.enabled) {
                clearServerMarkers(server.id);
                return;
            }

            debounceTimers.current[server.id] = setTimeout(
                () => fetchFromServer(server, force),
                server.debounceMs
            );
        });
    }, [servers, fetchFromServer, clearServerMarkers]);

    // Initial load and dependency triggers — force fetch (bypass skip-fetch)
    useEffect(() => {
        if (mapRef.current && mapRef.current.isStyleLoaded()) {
            fetchAllServers(true);
        } else if (mapRef.current) {
            mapRef.current.once("load", () => fetchAllServers(true));
        }
    }, [yearStart, yearEnd, refreshKey, fetchAllServers]);

    // Move bounds listener — uses skip-fetch logic (not forced)
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;

        let moveDebounce: ReturnType<typeof setTimeout>;

        const onMoveEnd = () => {
            clearTimeout(moveDebounce);
            moveDebounce = setTimeout(() => fetchAllServers(false), 100);
        };

        map.on("moveend", onMoveEnd);
        return () => {
            map.off("moveend", onMoveEnd);
            clearTimeout(moveDebounce);
            Object.values(debounceTimers.current).forEach(clearTimeout);
        };
    }, [fetchAllServers]);

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainer} className="w-full h-full" />
            {loading && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
                    <div className="bg-[#191919] border border-[#2f2f2f] px-5 py-2.5 rounded-lg flex items-center gap-3 shadow-md">
                        <div className="w-3.5 h-3.5 border-2 border-[#2383e2] border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-medium text-gray-300">Loading maps...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
