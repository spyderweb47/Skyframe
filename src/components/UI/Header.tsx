"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

interface HeaderProps {
    onAddEvent: () => void;
    onAuthClick: () => void;
}

export default function Header({ onAddEvent, onAuthClick }: HeaderProps) {
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none">
            <div className="flex items-center justify-between px-6 py-4">
                {/* Logo */}
                <div className="pointer-events-auto bg-[#191919] border border-[#2f2f2f] flex items-center gap-3 rounded-lg px-4 py-2 shadow-sm">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ededed" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <div>
                        <span className="text-sm font-bold text-[#ededed] block leading-tight">
                            SkyFrame
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                            Temporal Explorer
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="pointer-events-auto flex items-center gap-3">
                    {session?.user && (
                        <button
                            onClick={onAddEvent}
                            className="flex items-center gap-2 bg-[#2383e2] hover:bg-[#1d6bba] text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            Add Event
                        </button>
                    )}

                    {session?.user ? (
                        <div className="relative">
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="bg-[#191919] border border-[#2f2f2f] flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#252525] transition-colors shadow-sm"
                            >
                                <div className="w-5 h-5 rounded-sm bg-[#5a5a5a] flex items-center justify-center text-white text-[10px] font-bold">
                                    {session.user.name?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <span className="text-sm text-gray-300 max-w-[120px] truncate font-medium">
                                    {session.user.name}
                                </span>
                            </button>

                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-48 bg-[#191919] border border-[#2f2f2f] rounded-md overflow-hidden z-20 shadow-lg">
                                        <div className="px-3 py-2 border-b border-[#2f2f2f]">
                                            <p className="text-sm text-gray-200 font-semibold truncate">{session.user.name}</p>
                                            <p className="text-xs text-gray-500 truncate mt-0.5">{session.user.email}</p>
                                        </div>
                                        <button
                                            onClick={() => { signOut(); setMenuOpen(false); }}
                                            className="w-full px-3 py-2 text-left text-sm text-[#eb5757] hover:bg-[#2f2f2f] transition-colors font-medium"
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={onAuthClick}
                            className="bg-[#191919] border border-[#2f2f2f] px-3 py-2 rounded-md text-sm text-gray-300 hover:text-white hover:bg-[#252525] transition-colors font-medium shadow-sm"
                        >
                            Sign in
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
