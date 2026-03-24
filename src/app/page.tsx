"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { EventData, DataServer, DEFAULT_SERVERS } from "@/lib/types";
import Header from "@/components/UI/Header";
import TimeSlider from "@/components/TimeSlider/TimeSlider";
import EventPanel from "@/components/Events/EventPanel";
import WikiPanel from "@/components/Events/WikiPanel";
import EventForm from "@/components/Events/EventForm";
import AuthModal from "@/components/Auth/AuthModal";
import ServerManager from "@/components/Servers/ServerManager";

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

const STORAGE_KEY = "skyframe-servers";

function loadServers(): DataServer[] {
  if (typeof window === "undefined") return DEFAULT_SERVERS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SERVERS;
    const parsed: DataServer[] = JSON.parse(stored);
    // Merge: always keep built-in servers from code, overlay stored toggle states
    const builtinIds = DEFAULT_SERVERS.map((s) => s.id);
    const builtins = DEFAULT_SERVERS.map((def) => {
      const saved = parsed.find((s) => s.id === def.id);
      return saved ? { ...def, enabled: saved.enabled } : def;
    });
    const customs = parsed.filter((s) => !builtinIds.includes(s.id));
    return [...builtins, ...customs];
  } catch {
    return DEFAULT_SERVERS;
  }
}

function saveServers(servers: DataServer[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(servers));
}

export default function HomePage() {
  const { data: session } = useSession();
  const [yearStart, setYearStart] = useState(1400);
  const [yearEnd, setYearEnd] = useState(1600);
  const [servers, setServers] = useState<DataServer[]>(DEFAULT_SERVERS);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [editEvent, setEditEvent] = useState<EventData | null>(null);
  const [clickedLat, setClickedLat] = useState(0);
  const [clickedLng, setClickedLng] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load servers from localStorage on mount
  useEffect(() => {
    setServers(loadServers());
  }, []);

  const handleRangeChange = useCallback((start: number, end: number) => {
    setYearStart(start);
    setYearEnd(end);
  }, []);

  const handleLocationClick = useCallback(
    (lat: number, lng: number) => {
      if (selectedEvent) {
        setSelectedEvent(null);
        return;
      }

      setClickedLat(lat);
      setClickedLng(lng);

      if (!session?.user) {
        setShowAuth(true);
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

  // Server management
  const handleToggleServer = useCallback((serverId: string) => {
    setServers((prev) => {
      const updated = prev.map((s) =>
        s.id === serverId ? { ...s, enabled: !s.enabled } : s
      );
      saveServers(updated);
      return updated;
    });
  }, []);

  const handleAddServer = useCallback((server: DataServer) => {
    setServers((prev) => {
      const updated = [...prev, server];
      saveServers(updated);
      return updated;
    });
  }, []);

  const handleRemoveServer = useCallback((serverId: string) => {
    setServers((prev) => {
      const updated = prev.filter((s) => s.id !== serverId);
      saveServers(updated);
      return updated;
    });
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#06060c] relative">
      <MapView
        yearStart={yearStart}
        yearEnd={yearEnd}
        servers={servers}
        onLocationClick={handleLocationClick}
        onEventClick={handleEventClick}
        refreshKey={refreshKey}
      />

      <Header onAddEvent={handleAddEvent} onAuthClick={() => setShowAuth(true)} />

      <ServerManager
        servers={servers}
        onToggle={handleToggleServer}
        onAdd={handleAddServer}
        onRemove={handleRemoveServer}
      />

      <TimeSlider
        yearStart={yearStart}
        yearEnd={yearEnd}
        onRangeChange={handleRangeChange}
      />

      {selectedEvent?.isWikipedia ? (
        <WikiPanel
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      ) : (
        <EventPanel
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
        />
      )}

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
