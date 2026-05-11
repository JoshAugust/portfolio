

// ------------------------------------------------------------------
// Python Backend Response Types
// ------------------------------------------------------------------

interface FootprintPlatform {
    url: string | null;
    verified: boolean;
}

interface FootprintResult {
    linkedin: FootprintPlatform;
    twitter: FootprintPlatform;
    github: FootprintPlatform;
    substack: FootprintPlatform;
}

interface NetworkPeer {
    name: string;
    mentions: number;
}

interface NetworkResult {
    target: string;
    sources_checked: number;
    likely_peers: NetworkPeer[];
}

interface ContentResult {
    recent_topics: string[];
    latest_content: {
        title: string;
        url: string;
        summary: string;
        summary_highlights: string[];
    };
}

export interface EnrichResponse {
    footprint: FootprintResult;
    network: NetworkResult;
    content: ContentResult;
    discoveryScore?: number;
    careerFit?: number;
    summary?: {
        role: string;
        bullets: string[];
    };
}

// ------------------------------------------------------------------
// Python Backend URL
// ------------------------------------------------------------------

const PYTHON_API_BASE = 'http://localhost:8000';

// ------------------------------------------------------------------
// Python-backed raw enrichment (returns raw OSINT data for LLM processing)
// ------------------------------------------------------------------

/**
 * Fetch raw OSINT data from the Python FastAPI backend.
 * Returns the raw response for LLM summarization, or null if the backend
 * is offline or returns an error.
 *
 * @param name     Contact's full name.
 * @param company  Contact's company.
 * @returns Raw EnrichResponse or null if unavailable.
 */
export const fetchRawEnrichment = async (
    name: string,
    company: string
): Promise<EnrichResponse | null> => {
    try {
        const res = await fetch(`${PYTHON_API_BASE}/api/enrich-contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, company }),
            signal: AbortSignal.timeout(60_000), // 60s timeout for OSINT scraping
        });

        if (!res.ok) {
            throw new Error(`Server responded with ${res.status}`);
        }

        return await res.json() as EnrichResponse;
    } catch (error) {
        console.warn(
            '[fetchRawEnrichment] Python server unavailable:',
            error
        );
        return null;
    }
};

