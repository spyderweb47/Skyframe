"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { EventData } from "@/lib/types";
import { formatYear } from "@/lib/geo";

mapboxgl.accessToken = "pk.eyJ1Ijoic3B5ZGVyd2ViIiwiYSI6ImNtbjQxMW95bDE1b2EycXNnYXpuNGhmeXIifQ.R9g4X7IFuv8WbrQbg2kccw";

interface MapViewProps {
    yearStart: number;
    yearEnd: number;
    filter: string;
    onLocationClick: (lat: number, lng: number) => void;
    onEventClick: (event: EventData) => void;
    refreshKey: number;
}

export default function MapView({
    yearStart,
    yearEnd,
    filter,
    onLocationClick,
    onEventClick,
    refreshKey,
}: MapViewProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
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

        // Add standard navigation controls
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

        // Map click (ignoring marker clicks)
        map.on("click", (e) => {
            // If we click the map and not a marker/popup popup
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

    // Fetch and sync events
    const fetchEvents = useCallback(async () => {
        if (!mapRef.current) return;

        setLoading(true);
        const map = mapRef.current;
        const bounds = map.getBounds();
        if (!bounds) return;

        const midYear = Math.round((yearStart + yearEnd) / 2);
        const yearRange = Math.round((yearEnd - yearStart) / 2);

        const params = new URLSearchParams({
            north: bounds.getNorth().toString(),
            south: bounds.getSouth().toString(),
            east: bounds.getEast().toString(),
            west: bounds.getWest().toString(),
            year: midYear.toString(),
            yearRange: yearRange.toString(),
            filter: filter,
        });

        try {
            const res = await fetch(`/api/events?${params}`);
            const data = await res.json();
            const events: EventData[] = data.events || [];

            // Clear existing markers
            markersRef.current.forEach((marker) => marker.remove());
            markersRef.current = [];

            // Add new markers
            events.forEach((event) => {
                const el = document.createElement("div");
                const isPrivate = event.visibility === "private";
                el.className = `marker-pin ${isPrivate ? "marker-private" : "marker-public"}`;
                el.innerHTML = `
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" opacity="0.9"/>
                        <circle cx="12" cy="9" r="2.5" fill="${isPrivate ? '#141420' : '#06060c'}"/>
                    </svg>
                `;

                // Add click listener to DOM element
                el.addEventListener("click", (e) => {
                    e.stopPropagation();
                    onEventClick(event);
                });

                const popupHTML = `
                    <div class="event-popup p-3 rounded-lg bg-[#191919] border border-[#2f2f2f] shadow-sm">
                        <h3 class="popup-title text-gray-100 font-bold text-sm mb-1">${event.title}</h3>
                        <p class="popup-year text-xs font-medium text-gray-400 mb-1.5">${formatYear(event.year)}</p>
                        <p class="popup-desc text-xs text-gray-500 leading-relaxed">
                            ${event.description.substring(0, 140)}${event.description.length > 140 ? "..." : ""}
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

                const marker = new mapboxgl.Marker({ element: el })
                    .setLngLat([event.longitude, event.latitude])
                    .setPopup(popup)
                    .addTo(map);

                markersRef.current.push(marker);
            });
        } catch (error) {
            console.error("Failed to fetch events:", error);
        } finally {
            setLoading(false);
        }
    }, [yearStart, yearEnd, filter, onEventClick]);

    // Initial load and dependency triggers
    useEffect(() => {
        // Only fetch if map is fully loaded
        if (mapRef.current && mapRef.current.isStyleLoaded()) {
            fetchEvents();
        } else if (mapRef.current) {
            mapRef.current.once("load", fetchEvents);
        }
    }, [yearStart, yearEnd, filter, refreshKey, fetchEvents]);

    // Move bounds listener
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;

        let debounceTimer: ReturnType<typeof setTimeout>;
        const onMoveEnd = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(fetchEvents, 300);
        };

        map.on("moveend", onMoveEnd);
        return () => {
            map.off("moveend", onMoveEnd);
            clearTimeout(debounceTimer);
        };
    }, [fetchEvents]);

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainer} className="w-full h-full" />
            {loading && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
                    <div className="glass-card px-5 py-2.5 rounded-xl flex items-center gap-3">
                        <div className="w-3.5 h-3.5 border-2 border-[#7c6aff] border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-[#9898b8]">Loading map context...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
