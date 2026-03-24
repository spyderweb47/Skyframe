"use client";

import { useState, useEffect } from "react";
import { EventData, EventFormData } from "@/lib/types";

interface EventFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    editEvent?: EventData | null;
    defaultLat?: number;
    defaultLng?: number;
    defaultYear?: number;
}

export default function EventForm({
    isOpen,
    onClose,
    onSubmit,
    editEvent,
    defaultLat,
    defaultLng,
    defaultYear,
}: EventFormProps) {
    const [formData, setFormData] = useState<EventFormData>({
        title: "",
        description: "",
        year: defaultYear || 2000,
        latitude: defaultLat || 0,
        longitude: defaultLng || 0,
        visibility: "public",
        source: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (editEvent) {
            setFormData({
                title: editEvent.title,
                description: editEvent.description,
                year: editEvent.year,
                latitude: editEvent.latitude,
                longitude: editEvent.longitude,
                visibility: editEvent.visibility,
                source: editEvent.source || "",
            });
        } else {
            setFormData({
                title: "",
                description: "",
                year: defaultYear || 2000,
                latitude: defaultLat || 0,
                longitude: defaultLng || 0,
                visibility: "public",
                source: "",
            });
        }
        setError("");
    }, [editEvent, defaultLat, defaultLng, defaultYear, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const url = editEvent ? `/api/events/${editEvent.id}` : "/api/events";
            const method = editEvent ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save event");
            onSubmit();
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        "w-full px-4 py-2.5 rounded-md notion-input";

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-[#000000]/70 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative w-full max-w-md bg-[#191919] border border-[#2f2f2f] rounded-lg shadow-2xl overflow-hidden animate-scaleIn">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#2f2f2f]">
                    <h2 className="text-lg font-bold text-[#ededed]">
                        {editEvent ? "Edit Event" : "New Event"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-200 transition-colors w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#2f2f2f]"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-7 pb-7 pt-5">
                    {error && (
                        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/12 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Title
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className={inputClass}
                            placeholder="Battle of Thermopylae"
                        />
                    </div>

                    <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Description
                        </label>
                        <textarea
                            required
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className={`${inputClass} resize-none`}
                            placeholder="Describe the historical event..."
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Year</label>
                            <input
                                type="number"
                                required
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
                                className={inputClass}
                            />
                            <p className="text-xs text-gray-500 mt-1.5">Negative = BC</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Latitude</label>
                            <input
                                type="number"
                                step="any"
                                required
                                value={formData.latitude}
                                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Longitude</label>
                            <input
                                type="number"
                                step="any"
                                required
                                value={formData.longitude}
                                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Source</label>
                        <input
                            type="text"
                            value={formData.source || ""}
                            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                            className={inputClass}
                            placeholder="Wikipedia, Herodotus..."
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Visibility</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, visibility: "public" })}
                                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${formData.visibility === "public"
                                    ? "bg-[#2f2f2f] text-white border-[#373737] shadow-sm"
                                    : "bg-transparent text-gray-400 border-[#2f2f2f] hover:text-gray-200 hover:bg-[#252525]"
                                    }`}
                            >
                                Public
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, visibility: "private" })}
                                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${formData.visibility === "private"
                                    ? "bg-[#2f2f2f] text-white border-[#373737] shadow-sm"
                                    : "bg-transparent text-gray-400 border-[#2f2f2f] hover:text-gray-200 hover:bg-[#252525]"
                                    }`}
                            >
                                Private
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-md bg-[#2383e2] hover:bg-[#1d6bba] text-white text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {loading ? "Saving..." : editEvent ? "Update Event" : "Create Event"}
                    </button>
                </form>
            </div>
        </div>
    );
}
