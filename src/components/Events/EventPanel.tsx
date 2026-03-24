"use client";

import { EventData } from "@/lib/types";
import { formatYear } from "@/lib/geo";
import { useSession } from "next-auth/react";
import { useState } from "react";

interface EventPanelProps {
    event: EventData | null;
    onClose: () => void;
    onEdit: (event: EventData) => void;
    onDelete: (eventId: string) => void;
}

export default function EventPanel({
    event,
    onClose,
    onEdit,
    onDelete,
}: EventPanelProps) {
    const { data: session } = useSession();
    const [deleting, setDeleting] = useState(false);
    const userId = (session?.user as { id?: string })?.id;
    const isOwner = userId && event?.userId === userId;

    if (!event) return null;

    const handleDelete = async () => {
        if (!confirm("Delete this event?")) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
            if (res.ok) onDelete(event.id);
        } catch (error) {
            console.error("Delete failed:", error);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="absolute top-0 right-0 h-full z-[1000] flex">
            <div className="w-[400px] h-full bg-[#191919] border-l border-[#2f2f2f] flex flex-col animate-slideIn shadow-2xl">

                {/* Header */}
                <div className="flex items-start justify-between gap-4 px-6 py-5">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-[17px] font-semibold text-gray-100 leading-snug mb-2.5">
                            {event.title}
                        </h2>
                        <div className="flex items-center gap-2.5">
                            <span className="text-xs font-medium text-gray-300 bg-[#2f2f2f] px-2.5 py-1 rounded-md border border-[#373737]">
                                {formatYear(event.year)}
                            </span>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${event.visibility === "private"
                                ? "text-[#e8b931] bg-[#e8b931]/10 border-[#e8b931]/20"
                                : "text-[#34d399] bg-[#34d399]/10 border-[#34d399]/20"
                                }`}>
                                {event.visibility === "private" ? "Private" : "Public"}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-[#2f2f2f] transition-colors flex-shrink-0 text-sm"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
                    <p className="text-[14px] text-gray-400 leading-[1.7] whitespace-pre-wrap">
                        {event.description}
                    </p>

                    <div className="space-y-3.5 pt-4 border-t border-[#2f2f2f]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 font-medium">Location</span>
                            <span className="text-sm text-gray-400 font-mono">
                                {event.latitude.toFixed(3)}°, {event.longitude.toFixed(3)}°
                            </span>
                        </div>

                        {event.source && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 font-medium">Source</span>
                                <span className="text-sm text-gray-400">{event.source}</span>
                            </div>
                        )}

                        {event.user && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 font-medium">Author</span>
                                <span className="text-sm text-gray-400">{event.user.name}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {isOwner && (
                    <div className="px-6 py-5 border-t border-[#2f2f2f] flex gap-3">
                        <button
                            onClick={() => onEdit(event)}
                            className="flex-1 px-4 py-2 rounded-md bg-[#252525] hover:bg-[#2f2f2f] text-gray-300 text-sm font-medium transition-colors border border-[#373737]"
                        >
                            Edit
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex-1 px-4 py-2 rounded-md bg-transparent hover:bg-red-500/10 text-[#eb5757] text-sm font-medium transition-colors border border-[#eb5757]/30 disabled:opacity-50"
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
