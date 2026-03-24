"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { EventData, DataServer } from "@/lib/types";
import { formatYear } from "@/lib/geo";

mapboxgl.accessToken = "pk.eyJ1Ijoic3B5ZGVyd2ViIiwiYSI6ImNtbjQxMW95bDE1b2EycXNnYXpuNGhmeXIifQ.R9g4X7IFuv8WbrQbg2kccw";

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

    // Build query params from current map state
    const getParams = useCallback(() => {
        if (!mapRef.current) return null;
        const bounds = mapRef.current.getBounds();
        if (!bounds) return null;

        const midYear = Math.round((yearStart + yearEnd) / 2);
        const yearRange = Math.round((yearEnd - yearStart) / 2);

        return new URLSearchParams({
            north: bounds.getNorth().toString(),
            south: bounds.getSouth().toString(),
            east: bounds.getEast().toString(),
            west: bounds.getWest().toString(),
            year: midYear.toString(),
            yearRange: yearRange.toString(),
        });
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
    const fetchFromServer = useCallback(async (server: DataServer) => {
        if (!mapRef.current || !server.enabled) return;

        const params = getParams();
        if (!params) return;

        const currentFetchId = ++fetchIdRef.current;

        // Determine the fetch URL
        let fetchUrl: string;
        if (server.builtin) {
            // Built-in servers use their URL directly (local API routes)
            fetchUrl = `${server.url}?${params}`;
        } else {
            // External servers go through the CORS proxy
            params.set("target", server.url);
            fetchUrl = `/api/server-proxy?${params}`;
        }

        try {
            if (server.id === "local") setLoading(true);

            const res = await fetch(fetchUrl);
            if (!res.ok) throw new Error(`Server ${server.name} returned ${res.status}`);
            const data = await res.json();

            // Stale check
            if (!mapRef.current) return;

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
                    // Wikipedia-style circular pin
                    el.innerHTML = `
                        <div class="flex items-center justify-center w-6 h-6 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)] font-serif text-[11px] font-bold border-2 border-[#191919] transition-transform hover:scale-110"
                             style="background-color:${server.color};color:#202122;">
                            ${server.icon}
                        </div>
                    `;
                } else if (server.id === "local") {
                    // Classic teardrop pin
                    const isPrivate = event.visibility === "private";
                    el.classList.add(isPrivate ? "marker-private" : "marker-public");
                    el.innerHTML = `
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" opacity="0.9"/>
                            <circle cx="12" cy="9" r="2.5" fill="${isPrivate ? '#141420' : '#06060c'}"/>
                        </svg>
                    `;
                } else {
                    // Custom server marker — colored circle with icon
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

                // Popup for non-wiki markers
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
        } catch (error) {
            console.error(`${server.name} fetch error:`, error);
            if (server.id === "local") setLoading(false);
        }
    }, [yearStart, yearEnd, getParams, clearServerMarkers, onEventClick]);

    // Trigger fetches for all enabled servers
    const fetchAllServers = useCallback(() => {
        // Clear all timers
        Object.values(debounceTimers.current).forEach(clearTimeout);
        debounceTimers.current = {};

        servers.forEach((server) => {
            if (!server.enabled) {
                // If server is disabled, clear its markers
                clearServerMarkers(server.id);
                return;
            }

            debounceTimers.current[server.id] = setTimeout(
                () => fetchFromServer(server),
                server.debounceMs
            );
        });
    }, [servers, fetchFromServer, clearServerMarkers]);

    // Initial load and dependency triggers
    useEffect(() => {
        if (mapRef.current && mapRef.current.isStyleLoaded()) {
            fetchAllServers();
        } else if (mapRef.current) {
            mapRef.current.once("load", fetchAllServers);
        }
    }, [yearStart, yearEnd, refreshKey, fetchAllServers]);

    // Move bounds listener
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;

        let moveDebounce: ReturnType<typeof setTimeout>;

        const onMoveEnd = () => {
            clearTimeout(moveDebounce);
            moveDebounce = setTimeout(fetchAllServers, 100);
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
