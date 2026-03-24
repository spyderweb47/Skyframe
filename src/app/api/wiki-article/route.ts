import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get("url");
    if (!url) {
        return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    // Extract the article title from a Wikipedia URL
    // e.g. https://en.wikipedia.org/wiki/Battle_of_Agincourt → Battle_of_Agincourt
    let title = "";
    try {
        const parsed = new URL(url);
        if (parsed.hostname.includes("wikipedia.org") && parsed.pathname.startsWith("/wiki/")) {
            title = parsed.pathname.replace("/wiki/", "");
        } else if (parsed.hostname.includes("wikidata.org")) {
            // For wikidata entity URLs, use the entity ID to get Wikipedia article
            const entityId = parsed.pathname.split("/").pop();
            // Fetch Wikipedia sitelink from Wikidata
            const wdRes = await fetch(
                `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=sitelinks&sitefilter=enwiki&format=json`,
                { headers: { "User-Agent": "SkyFrame/1.0" } }
            );
            const wdData = await wdRes.json();
            const entity = wdData.entities?.[entityId || ""];
            title = entity?.sitelinks?.enwiki?.title?.replace(/ /g, "_") || "";
            if (!title) {
                return NextResponse.json({
                    html: `<div style="padding:40px;font-family:Inter,sans-serif;color:#999;text-align:center;">
                        <h2 style="color:#ccc;margin-bottom:12px;">No Wikipedia Article</h2>
                        <p>This Wikidata entity doesn't have an English Wikipedia article yet.</p>
                        <a href="${url}" target="_blank" style="color:#2383e2;margin-top:16px;display:inline-block;">View on Wikidata ↗</a>
                    </div>`
                });
            }
        } else {
            return NextResponse.json({ error: "Not a Wikipedia/Wikidata URL" }, { status: 400 });
        }
    } catch {
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    try {
        // Fetch article HTML from Wikipedia REST API
        const res = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`,
            {
                headers: {
                    "User-Agent": "SkyFrame/1.0",
                    "Accept": "text/html"
                },
                signal: AbortSignal.timeout(8000),
            }
        );

        if (!res.ok) {
            throw new Error(`Wikipedia API returned ${res.status}`);
        }

        let html = await res.text();

        // Inject custom styles to make the Wikipedia content look good in dark mode
        const darkStyles = `
        <style>
            body {
                background: #191919 !important;
                color: #d4d4d4 !important;
                font-family: Inter, -apple-system, sans-serif !important;
                font-size: 14px !important;
                line-height: 1.7 !important;
                padding: 20px !important;
                max-width: 100% !important;
                overflow-x: hidden !important;
            }
            a { color: #2383e2 !important; }
            a:hover { color: #1d6bba !important; }
            h1, h2, h3, h4, h5, h6 { color: #e5e5e5 !important; border-color: #2f2f2f !important; }
            table { border-color: #2f2f2f !important; background: #1e1e1e !important; }
            td, th { border-color: #2f2f2f !important; color: #d4d4d4 !important; padding: 6px 10px !important; }
            th { background: #252525 !important; }
            .infobox, .sidebar, .navbox, .mw-parser-output > .mbox-small { 
                background: #1e1e1e !important; border-color: #2f2f2f !important; 
                float: none !important; width: 100% !important; margin: 12px 0 !important;
            }
            .infobox td, .infobox th { background: transparent !important; }
            img { max-width: 100% !important; height: auto !important; border-radius: 6px !important; }
            figure { margin: 12px 0 !important; }
            figcaption { color: #888 !important; font-size: 12px !important; }
            .mw-ref, .reference { font-size: 11px !important; }
            sup { line-height: 0 !important; }
            .hatnote, .dablink { color: #888 !important; font-style: italic !important; padding: 8px 12px !important; background: #1e1e1e !important; border-radius: 6px !important; margin-bottom: 12px !important; }
            .mw-heading { border-bottom: 1px solid #2f2f2f !important; padding-bottom: 4px !important; margin-top: 24px !important; }
            blockquote { border-left: 3px solid #2f2f2f !important; color: #aaa !important; padding-left: 16px !important; }
            code, pre { background: #1e1e1e !important; color: #d4d4d4 !important; border-radius: 4px !important; }
            .reflist, .references { font-size: 12px !important; color: #888 !important; }
            .navbox, .sistersitebox, .catlinks, .mw-authority-control { display: none !important; }
        </style>
        <base href="https://en.wikipedia.org/" target="_blank" />
        `;

        html = html.replace(/<head[^>]*>/, (match) => match + darkStyles);

        return new NextResponse(html, {
            headers: { "Content-Type": "text/html; charset=utf-8" }
        });

    } catch (e: any) {
        console.error("Wiki article fetch error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
