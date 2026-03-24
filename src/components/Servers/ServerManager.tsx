"use client";

import { useState } from "react";
import { DataServer } from "@/lib/types";

interface ServerManagerProps {
    servers: DataServer[];
    onToggle: (serverId: string) => void;
    onAdd: (server: DataServer) => void;
    onRemove: (serverId: string) => void;
}

export default function ServerManager({
    servers,
    onToggle,
    onAdd,
    onRemove,
}: ServerManagerProps) {
    const [expanded, setExpanded] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState("");
    const [newUrl, setNewUrl] = useState("");
    const [newColor, setNewColor] = useState("#4ade80");
    const [newIcon, setNewIcon] = useState("★");

    const handleAddServer = () => {
        if (!newName.trim() || !newUrl.trim()) return;

        const server: DataServer = {
            id: `custom-${Date.now()}`,
            name: newName.trim(),
            url: newUrl.trim(),
            color: newColor,
            icon: newIcon || "●",
            enabled: true,
            builtin: false,
            debounceMs: 500,
        };

        onAdd(server);
        setNewName("");
        setNewUrl("");
        setNewColor("#4ade80");
        setNewIcon("★");
        setShowAddForm(false);
    };

    const enabledCount = servers.filter((s) => s.enabled).length;

    return (
        <div className="absolute top-[80px] left-6 z-[1000]">
            {/* Collapsed pill */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="bg-[#191919] border border-[#2f2f2f] rounded-lg px-3.5 py-2 flex items-center gap-2.5 shadow-sm hover:bg-[#1e1e1e] transition-colors"
            >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-gray-400">
                    <circle cx="4" cy="4" r="2" fill="currentColor" />
                    <circle cx="12" cy="4" r="2" fill="currentColor" />
                    <circle cx="4" cy="12" r="2" fill="currentColor" />
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                </svg>
                <span className="text-sm font-medium text-gray-300">
                    Servers
                </span>
                <span className="text-[10px] font-medium text-gray-500 bg-[#2f2f2f] px-1.5 py-0.5 rounded">
                    {enabledCount}/{servers.length}
                </span>
                <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    className={`text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`}
                >
                    <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </button>

            {/* Expanded panel */}
            {expanded && (
                <div className="mt-2 bg-[#191919] border border-[#2f2f2f] rounded-lg shadow-xl w-[280px] overflow-hidden">
                    {/* Server list */}
                    <div className="px-3 py-2.5 space-y-1">
                        {servers.map((server) => (
                            <div
                                key={server.id}
                                className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-[#252525] transition-colors group"
                            >
                                <button
                                    onClick={() => onToggle(server.id)}
                                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${server.enabled
                                            ? "bg-[#2383e2] border-[#2383e2]"
                                            : "border-[#444] bg-transparent"
                                        }`}
                                >
                                    {server.enabled && (
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                            <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </button>

                                <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 border border-[#333]"
                                    style={{ backgroundColor: server.color, color: server.color === "#f8f9fa" ? "#202122" : "#fff" }}
                                >
                                    {server.icon}
                                </div>

                                <span className={`text-sm font-medium flex-1 truncate transition-colors ${server.enabled ? "text-gray-200" : "text-gray-500"
                                    }`}>
                                    {server.name}
                                </span>

                                {!server.builtin && (
                                    <button
                                        onClick={() => onRemove(server.id)}
                                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-[#eb5757] text-xs transition-all"
                                        title="Remove server"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Divider + Add server */}
                    <div className="border-t border-[#2f2f2f] px-3 py-2.5">
                        {!showAddForm ? (
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="w-full text-left px-2 py-1.5 rounded-md text-sm font-medium text-gray-400 hover:text-[#2383e2] hover:bg-[#252525] transition-colors flex items-center gap-2"
                            >
                                <span className="text-base leading-none">+</span>
                                Add Server
                            </button>
                        ) : (
                            <div className="space-y-2.5">
                                <input
                                    type="text"
                                    placeholder="Server name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full bg-[#252525] border border-[#373737] rounded-md px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:border-[#2383e2] focus:outline-none transition-colors"
                                />
                                <input
                                    type="url"
                                    placeholder="API endpoint URL"
                                    value={newUrl}
                                    onChange={(e) => setNewUrl(e.target.value)}
                                    className="w-full bg-[#252525] border border-[#373737] rounded-md px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:border-[#2383e2] focus:outline-none transition-colors"
                                />
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-2 flex-1">
                                        <input
                                            type="color"
                                            value={newColor}
                                            onChange={(e) => setNewColor(e.target.value)}
                                            className="w-7 h-7 rounded border border-[#373737] cursor-pointer bg-transparent"
                                            title="Marker color"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Icon"
                                            value={newIcon}
                                            onChange={(e) => setNewIcon(e.target.value)}
                                            maxLength={2}
                                            className="w-12 bg-[#252525] border border-[#373737] rounded-md px-2 py-1.5 text-sm text-gray-200 text-center focus:border-[#2383e2] focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddServer}
                                        disabled={!newName.trim() || !newUrl.trim()}
                                        className="flex-1 px-3 py-1.5 rounded-md bg-[#2383e2] hover:bg-[#1d6bba] text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Add
                                    </button>
                                    <button
                                        onClick={() => setShowAddForm(false)}
                                        className="px-3 py-1.5 rounded-md bg-[#252525] hover:bg-[#2f2f2f] text-gray-400 text-sm font-medium transition-colors border border-[#373737]"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
