import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(searchParams.get("year") || "1500");
    const yearRange = parseInt(searchParams.get("yearRange") || "100");
    const yearStart = year - yearRange;
    const yearEnd = year + yearRange;
    const north = parseFloat(searchParams.get("north") || "90");
    const south = parseFloat(searchParams.get("south") || "-90");
    const east = parseFloat(searchParams.get("east") || "180");
    const west = parseFloat(searchParams.get("west") || "-180");

    let sparqlQuery = "";

    // If the map is zoomed out globally, don't use the bounding box filter to avoid timeouts.
    if (north - south > 100) {
        sparqlQuery = `
        SELECT ?event ?eventLabel ?date ?lat ?lon ?article WHERE {
          {
            SELECT ?event ?date ?lat ?lon WHERE {
              ?event wdt:P31/wdt:P279* wd:Q1190554.
              ?event wdt:P585 ?date.
              FILTER(YEAR(?date) >= ${yearStart} && YEAR(?date) <= ${yearEnd})
              ?event p:P625/psv:P625 ?node.
              ?node wikibase:geoLatitude ?lat.
              ?node wikibase:geoLongitude ?lon.
            }
            LIMIT 150
          }
          OPTIONAL {
            ?article schema:about ?event.
            ?article schema:isPartOf <https://en.wikipedia.org/>.
          }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
        `;
    } else {
        // Detailed bounded map search
        sparqlQuery = `
        SELECT ?event ?eventLabel ?date ?lat ?lon ?article WHERE {
          {
            SELECT ?event ?date ?lat ?lon WHERE {
              ?event wdt:P31/wdt:P279* wd:Q1190554.
              ?event wdt:P585 ?date.
              FILTER(YEAR(?date) >= ${yearStart} && YEAR(?date) <= ${yearEnd})
              ?event p:P625/psv:P625 ?node.
              ?node wikibase:geoLatitude ?lat.
              ?node wikibase:geoLongitude ?lon.
              FILTER(?lat >= ${south} && ?lat <= ${north} && ?lon >= ${west} && ?lon <= ${east})
            }
            LIMIT 250
          }
          OPTIONAL {
            ?article schema:about ?event.
            ?article schema:isPartOf <https://en.wikipedia.org/>.
          }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
        `;
    }

    try {
        const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(sparqlQuery) + "&format=json";
        const response = await fetch(url, {
            headers: {
                "User-Agent": "SkyFrame/1.0 (Contact: admin@skyframe.local)",
                "Accept": "application/sparql-results+json"
            },
            next: { revalidate: 3600 }, // Cache for 1 hour
            signal: AbortSignal.timeout(8000) // Fallback timeout so it doesn't hang
        });

        if (!response.ok) {
            console.error("Wikidata error:", response.status, await response.text());
            return NextResponse.json({ error: "Failed to fetch from Wikidata" }, { status: 500 });
        }

        const data = await response.json();
        const results = data.results.bindings;

        const events = results.map((b: any) => ({
            id: 'wiki-' + b.event.value.split('/').pop(),
            title: b.eventLabel.value,
            description: "Sourced from Wikipedia/Wikidata.",
            year: new Date(b.date.value).getFullYear(),
            latitude: parseFloat(b.lat.value),
            longitude: parseFloat(b.lon.value),
            source: b.article ? b.article.value : b.event.value,
            visibility: "public",
            isWikipedia: true
        }));

        return NextResponse.json({ events });

    } catch (e: any) {
        console.error("SPARQL Parse Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
