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
