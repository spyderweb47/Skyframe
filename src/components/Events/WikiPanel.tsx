"use client";

import { EventData } from "@/lib/types";
import { formatYear } from "@/lib/geo";

interface WikiPanelProps {
    event: EventData | null;
    onClose: () => void;
}

export default function WikiPanel({ event, onClose }: WikiPanelProps) {
    if (!event || !event.isWikipedia) return null;

    const articleUrl = `/api/wiki-article?url=${encodeURIComponent(event.source ?? "")}`;

    return (
        <div className="absolute top-0 right-0 h-full z-[1000] flex">
            <div className="w-[520px] h-full bg-[#191919] border-l border-[#2f2f2f] flex flex-col animate-slideIn shadow-2xl">

                {/* Header */}
                <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#2f2f2f] flex-shrink-0">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-5 h-5 rounded-full bg-[#f8f9fa] text-[#202122] flex items-center justify-center font-serif text-[10px] font-bold flex-shrink-0">
                                W
                            </div>
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Wikipedia</span>
                        </div>
                        <h2 className="text-[15px] font-semibold text-gray-100 leading-snug truncate">
                            {event.title}
                        </h2>
                        <span className="text-xs font-medium text-gray-500 mt-1 block">
                            {formatYear(event.year)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                            href={event.source ?? undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#2383e2] hover:text-[#1d6bba] transition-colors font-medium"
                            title="Open in new tab"
                        >
                            ↗
                        </a>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-[#2f2f2f] transition-colors text-sm"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Wikipedia Article Content */}
                <div className="flex-1 overflow-hidden">
                    <iframe
                        src={articleUrl}
                        className="w-full h-full border-0"
                        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                        title={`Wikipedia: ${event.title}`}
                    />
                </div>
            </div>
        </div>
    );
}
