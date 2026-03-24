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
    const zoom = parseFloat(searchParams.get("zoom") || "3");

    // Zoom-adaptive SPARQL LIMIT
    const sparqlLimit = zoom <= 4 ? 80 : zoom <= 7 ? 150 : 300;

    let sparqlQuery = "";
    let useBoundedQuery = false;

    // If the map is zoomed out broadly, skip bounding box filter to avoid SPARQL timeouts.
    // The buffered bounds make the span larger, so use a lower threshold.
    const isGlobalView = north - south > 80;

    if (isGlobalView) {
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
            LIMIT ${sparqlLimit}
          }
          OPTIONAL {
            ?article schema:about ?event.
            ?article schema:isPartOf <https://en.wikipedia.org/>.
          }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
        `;
    } else {
        useBoundedQuery = true;
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
            LIMIT ${sparqlLimit + 100}
          }
          OPTIONAL {
            ?article schema:about ?event.
            ?article schema:isPartOf <https://en.wikipedia.org/>.
          }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
        `;
    }

    // Helper to run a SPARQL query
    async function runQuery(query: string): Promise<Response> {
        const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(query) + "&format=json";
        return fetch(url, {
            headers: {
                "User-Agent": "SkyFrame/1.0 (Contact: admin@skyframe.local)",
                "Accept": "application/sparql-results+json"
            },
            next: { revalidate: 3600 },
            signal: AbortSignal.timeout(20000)
        });
    }

    try {
        let response = await runQuery(sparqlQuery);

        // If bounded query failed, fall back to a simpler global query
        if (!response.ok && useBoundedQuery) {
            console.warn(`Wikidata bounded query failed (${response.status}), falling back to global query`);
            const fallbackQuery = `
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
                LIMIT ${sparqlLimit}
              }
              OPTIONAL {
                ?article schema:about ?event.
                ?article schema:isPartOf <https://en.wikipedia.org/>.
              }
              SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
            }
            `;
            try {
                response = await runQuery(fallbackQuery);
            } catch {
                // Fallback also failed — return empty
                console.warn("Wikidata fallback query also failed, returning empty events");
                return NextResponse.json({ events: [] });
            }
        }

        if (!response.ok) {
            console.warn("Wikidata query returned", response.status, "— returning empty events");
            return NextResponse.json({ events: [] });
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
        // Timeout or network error — return empty events gracefully
        console.warn("Wikidata query error:", e.message);
        return NextResponse.json({ events: [] });
    }
}
