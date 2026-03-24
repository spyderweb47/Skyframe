"use client";

interface FilterControlsProps {
    filter: string;
    onChange: (filter: string) => void;
    isAuthenticated: boolean;
}

export default function FilterControls({
    filter,
    onChange,
    isAuthenticated,
}: FilterControlsProps) {
    const filters = [
        { id: "all", label: "All Events" },
        { id: "public", label: "Public" },
        ...(isAuthenticated ? [{ id: "private", label: "My Private" }] : []),
    ];

    return (
        <div className="absolute top-[80px] left-6 z-[1000]">
            <div className="bg-[#191919] border border-[#2f2f2f] rounded-lg p-1 flex gap-1 shadow-sm">
                {filters.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => onChange(f.id)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filter === f.id
                            ? "bg-[#2f2f2f] text-white shadow-sm"
                            : "text-gray-400 hover:text-gray-200"
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
