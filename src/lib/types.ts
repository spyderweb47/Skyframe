export interface DataServer {
    id: string;
    name: string;
    url: string;
    color: string;
    icon: string;
    enabled: boolean;
    builtin: boolean;
    debounceMs: number;
}

export interface EventData {
    id: string;
    title: string;
    description: string;
    year: number;
    latitude: number;
    longitude: number;
    visibility: "public" | "private";
    imageUrl?: string | null;
    source?: string | null;
    userId: string;
    createdAt: string;
    user?: {
        name: string;
    };
    isWikipedia?: boolean;
    serverId?: string;
}

export interface EventFormData {
    title: string;
    description: string;
    year: number;
    latitude: number;
    longitude: number;
    visibility: "public" | "private";
    imageUrl?: string;
    source?: string;
}

export interface MapBounds {
    north: number;
    south: number;
    east: number;
    west: number;
}

// Built-in servers
export const DEFAULT_SERVERS: DataServer[] = [
    {
        id: "local",
        name: "SkyFrame DB",
        url: "/api/events",
        color: "#7c6aff",
        icon: "📍",
        enabled: true,
        builtin: true,
        debounceMs: 100,
    },
    {
        id: "wikidata",
        name: "Wikipedia",
        url: "/api/wikidata",
        color: "#f8f9fa",
        icon: "W",
        enabled: true,
        builtin: true,
        debounceMs: 1200,
    },
];

