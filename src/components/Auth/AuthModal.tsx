"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            if (mode === "register") {
                const res = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, name, password }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                const result = await signIn("credentials", { email, password, redirect: false });
                if (result?.error) throw new Error(result.error);
            } else {
                const result = await signIn("credentials", { email, password, redirect: false });
                if (result?.error) throw new Error(result.error);
            }
            onClose();
            setEmail("");
            setName("");
            setPassword("");
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
            <div className="relative w-full max-w-[400px] bg-[#191919] border border-[#2f2f2f] rounded-lg shadow-2xl overflow-hidden animate-scaleIn">

                {/* Header */}
                <div className="px-7 pt-7 pb-4 text-center flex flex-col items-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ededed" strokeWidth="1.5" className="mb-4">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <h2 className="text-xl font-bold text-[#ededed]">
                        {mode === "login" ? "Welcome back" : "Create account"}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1.5">
                        {mode === "login" ? "Sign in to explore & contribute" : "Join SkyFrame to add events"}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex mx-7 mb-2 border-b border-[#2f2f2f]">
                    <button
                        onClick={() => { setMode("login"); setError(""); }}
                        className={`flex-1 pb-2.5 text-sm font-medium transition-colors ${mode === "login"
                            ? "text-white border-b-2 border-white"
                            : "text-gray-400 hover:text-gray-300"
                            }`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => { setMode("register"); setError(""); }}
                        className={`flex-1 pb-2.5 text-sm font-medium transition-colors ${mode === "register"
                            ? "text-white border-b-2 border-white"
                            : "text-gray-400 hover:text-gray-300"
                            }`}
                    >
                        Register
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-7 pb-7 pt-5">
                    {error && (
                        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/12 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {mode === "register" && (
                        <div className="mb-5">
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
                            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Your name" />
                        </div>
                    )}

                    <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-md bg-[#2383e2] hover:bg-[#1d6bba] text-white text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
                    </button>
                </form>
            </div>
        </div>
    );
}
