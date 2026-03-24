import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { haversineDistance } from "@/lib/geo";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const lat = parseFloat(searchParams.get("lat") || "0");
        const lng = parseFloat(searchParams.get("lng") || "0");
        const year = parseInt(searchParams.get("year") || "2000");
        const radius = parseFloat(searchParams.get("radius") || "5000");
        const north = parseFloat(searchParams.get("north") || "90");
        const south = parseFloat(searchParams.get("south") || "-90");
        const east = parseFloat(searchParams.get("east") || "180");
        const west = parseFloat(searchParams.get("west") || "-180");
        const yearRange = parseInt(searchParams.get("yearRange") || "50");
        const filter = searchParams.get("filter") || "all";
        const zoom = parseFloat(searchParams.get("zoom") || "3");

        // Zoom-adaptive limit: fewer events at global view, more when zoomed in
        const takeLimit = Math.round(
            Math.min(500, Math.max(100, 100 + (zoom - 3) * (400 / 7)))
        );

        const session = await getServerSession(authOptions);
        const userId = (session?.user as { id?: string })?.id;

        // Build where conditions
        const where: Record<string, unknown> = {
            latitude: { gte: south, lte: north },
            longitude: { gte: west, lte: east },
            year: { gte: year - yearRange, lte: year + yearRange },
        };

        if (filter === "public") {
            where.visibility = "public";
        } else if (filter === "private") {
            if (!userId) {
                return NextResponse.json({ events: [] });
            }
            where.visibility = "private";
            where.userId = userId;
        } else {
            // "all" - public + user's private
            if (userId) {
                where.OR = [
                    { visibility: "public" },
                    { visibility: "private", userId: userId },
                ];
                delete where.visibility;
            } else {
                where.visibility = "public";
            }
        }

        const events = await prisma.event.findMany({
            where: where as any,
            include: {
                user: {
                    select: { name: true },
                },
            },
            orderBy: { year: "asc" },
            take: takeLimit,
        });

        // If lat/lng provided, filter by radius
        let filteredEvents = events;
        if (lat !== 0 || lng !== 0) {
            filteredEvents = events.filter(
                (event) =>
                    haversineDistance(lat, lng, event.latitude, event.longitude) <= radius
            );
        }

        return NextResponse.json({ events: filteredEvents });
    } catch (error) {
        console.error("Error fetching events:", error);
        return NextResponse.json(
            { error: "Failed to fetch events" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, year, latitude, longitude, visibility, imageUrl, source } = body;

        if (!title || !description || year === undefined || !latitude || !longitude) {
            return NextResponse.json(
                { error: "Title, description, year, latitude, and longitude are required" },
                { status: 400 }
            );
        }

        const event = await prisma.event.create({
            data: {
                title,
                description,
                year: parseInt(year),
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                visibility: visibility || "public",
                imageUrl: imageUrl || null,
                source: source || null,
                userId,
            },
            include: {
                user: { select: { name: true } },
            },
        });

        return NextResponse.json({ event }, { status: 201 });
    } catch (error) {
        console.error("Error creating event:", error);
        return NextResponse.json(
            { error: "Failed to create event" },
            { status: 500 }
        );
    }
}
