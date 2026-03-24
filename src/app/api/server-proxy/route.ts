import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const targetUrl = request.nextUrl.searchParams.get("target");
    if (!targetUrl) {
        return NextResponse.json({ error: "Missing target parameter" }, { status: 400 });
    }

    // Forward all other query params to the target
    const forwardParams = new URLSearchParams();
    request.nextUrl.searchParams.forEach((value, key) => {
        if (key !== "target") forwardParams.set(key, value);
    });

    const fullUrl = forwardParams.toString()
        ? `${targetUrl}?${forwardParams}`
        : targetUrl;

    try {
        const response = await fetch(fullUrl, {
            headers: {
                "User-Agent": "SkyFrame/1.0",
                "Accept": "application/json",
            },
            signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Remote server returned ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (e: any) {
        console.error("Server proxy error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
