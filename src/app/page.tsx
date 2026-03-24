"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { EventData } from "@/lib/types";
import Header from "@/components/UI/Header";
import TimeSlider from "@/components/TimeSlider/TimeSlider";
import EventPanel from "@/components/Events/EventPanel";
import EventForm from "@/components/Events/EventForm";
import AuthModal from "@/components/Auth/AuthModal";
import FilterControls from "@/components/Filters/FilterControls";

const MapView = dynamic(() => import("@/components/Map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#06060c] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#7c6aff] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[#383850] text-sm">Loading map...</p>
      </div>
    </div>
  ),
});

export default function HomePage() {
  const { data: session } = useSession();
  const [yearStart, setYearStart] = useState(1400);
  const [yearEnd, setYearEnd] = useState(1600);
  const [filter, setFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [editEvent, setEditEvent] = useState<EventData | null>(null);
  const [clickedLat, setClickedLat] = useState(0);
  const [clickedLng, setClickedLng] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRangeChange = useCallback((start: number, end: number) => {
    setYearStart(start);
    setYearEnd(end);
  }, []);

  const handleLocationClick = useCallback(
    (lat: number, lng: number) => {
      if (selectedEvent) {
        setSelectedEvent(null);
        return; // Just close the panel on the first click
      }

      setClickedLat(lat);
      setClickedLng(lng);

      if (!session?.user) {
        setShowAuth(true); // Prompt to sign in
        return;
      }

      setEditEvent(null);
      setShowEventForm(true);
    },
    [session, selectedEvent]
  );

  const handleEventClick = useCallback((event: EventData) => {
    setSelectedEvent(event);
  }, []);

  const handleAddEvent = () => {
    if (!session?.user) {
      setShowAuth(true);
      return;
    }
    setEditEvent(null);
    setClickedLat(0);
    setClickedLng(0);
    setShowEventForm(true);
  };

  const handleEditEvent = (event: EventData) => {
    setEditEvent(event);
    setShowEventForm(true);
  };

  const handleDeleteEvent = () => {
    setSelectedEvent(null);
    setRefreshKey((k) => k + 1);
  };

  const handleEventSubmit = () => {
    setRefreshKey((k) => k + 1);
    setSelectedEvent(null);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#06060c] relative">
      <MapView
        yearStart={yearStart}
        yearEnd={yearEnd}
        filter={filter}
        onLocationClick={handleLocationClick}
        onEventClick={handleEventClick}
        refreshKey={refreshKey}
      />

      <Header onAddEvent={handleAddEvent} onAuthClick={() => setShowAuth(true)} />

      <FilterControls
        filter={filter}
        onChange={setFilter}
        isAuthenticated={!!session?.user}
      />

      <TimeSlider
        yearStart={yearStart}
        yearEnd={yearEnd}
        onRangeChange={handleRangeChange}
      />

      <EventPanel
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />

      <EventForm
        isOpen={showEventForm}
        onClose={() => {
          setShowEventForm(false);
          setEditEvent(null);
        }}
        onSubmit={handleEventSubmit}
        editEvent={editEvent}
        defaultLat={clickedLat}
        defaultLng={clickedLng}
        defaultYear={Math.round((yearStart + yearEnd) / 2)}
      />

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />

      {!session?.user && (
        <div className="absolute bottom-[130px] left-1/2 -translate-x-1/2 z-[999]">
          <button
            onClick={() => setShowAuth(true)}
            className="bg-[#191919] border border-[#2f2f2f] px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-[#252525] transition-colors shadow-sm"
          >
            Sign in to add events
          </button>
        </div>
      )}
    </div>
  );
}
