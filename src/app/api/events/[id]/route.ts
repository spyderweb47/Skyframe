import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        const { id } = await params;

        const existingEvent = await prisma.event.findUnique({
            where: { id },
        });

        if (!existingEvent) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        if (existingEvent.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { title, description, year, latitude, longitude, visibility, imageUrl, source } = body;

        const event = await prisma.event.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description && { description }),
                ...(year !== undefined && { year: parseInt(year) }),
                ...(latitude !== undefined && { latitude: parseFloat(latitude) }),
                ...(longitude !== undefined && { longitude: parseFloat(longitude) }),
                ...(visibility && { visibility }),
                ...(imageUrl !== undefined && { imageUrl }),
                ...(source !== undefined && { source }),
            },
            include: {
                user: { select: { name: true } },
            },
        });

        return NextResponse.json({ event });
    } catch (error) {
        console.error("Error updating event:", error);
        return NextResponse.json(
            { error: "Failed to update event" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        const { id } = await params;

        const existingEvent = await prisma.event.findUnique({
            where: { id },
        });

        if (!existingEvent) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        if (existingEvent.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.event.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Event deleted" });
    } catch (error) {
        console.error("Error deleting event:", error);
        return NextResponse.json(
            { error: "Failed to delete event" },
            { status: 500 }
        );
    }
}
