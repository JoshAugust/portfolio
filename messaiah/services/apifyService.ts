// services/apifyService.ts
export const getApifyKey = () => localStorage.getItem('APIFY_API_KEY');

export const setApifyKey = (key: string) => {
    localStorage.setItem('APIFY_API_KEY', key);
};

export const hasApifyKey = () => {
    return !!getApifyKey();
};

export const testApifyKey = async (): Promise<boolean> => {
    const key = getApifyKey();
    if (!key) return false;

    try {
        const response = await fetch(`https://api.apify.com/v2/users/me?token=${key}`);
        if (response.ok) {
            return true;
        }
        return false;
    } catch (e) {
        console.error("Failed to validate Apify key:", e);
        return false;
    }
};

export interface ScrapedLinkedInProfile {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    headline?: string;
    summary?: string;
    industry?: string;
    location?: string;
    profilePicUrl?: string;
    experiences?: Array<{
        title: string;
        company: string;
        duration?: string;
        location?: string;
    }>;
}

// LinkedIn profile scraper on Apify (johnvc/linkedin-profile-api).
// REST paths take the owner~name form.
const ACTOR_ID = 'johnvc~linkedin-profile-api';

export const scrapeLinkedInProfile = async (linkedinUrl: string, onProgress?: (status: string) => void): Promise<ScrapedLinkedInProfile | null> => {
    const key = getApifyKey();
    if (!key) {
        throw new Error("Apify API key is missing");
    }

    try {
        if (onProgress) onProgress('Starting Apify Actor...');
        
        // 1. Start the Actor Run
        const startRunResponse = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${key}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                profileUrls: [linkedinUrl]
            })
        });

        if (!startRunResponse.ok) {
            const err = await startRunResponse.text();
            throw new Error(`Failed to start run: ${err}`);
        }

        const runData = await startRunResponse.json();
        const runId = runData.data.id;
        let defaultDatasetId = runData.data.defaultDatasetId;

        if (onProgress) onProgress('Scraping in progress (this may take 15-30 seconds)...');

        // 2. Poll for completion
        let isRunning = true;
        while (isRunning) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // Poll every 3 seconds

            const statusResponse = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs/${runId}?token=${key}`);
            if (!statusResponse.ok) {
                throw new Error("Failed to check run status");
            }
            
            const statusData = await statusResponse.json();
            const status = statusData.data.status;
            
            if (status === 'SUCCEEDED') {
                isRunning = false;
                defaultDatasetId = statusData.data.defaultDatasetId;
            } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
                throw new Error(`Actor run ended with status: ${status}`);
            }
        }

        if (onProgress) onProgress('Scraping complete, fetching results...');

        // 3. Fetch Dataset Results
        const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${defaultDatasetId}/items?token=${key}`);
        if (!datasetResponse.ok) {
            throw new Error("Failed to fetch dataset items");
        }

        const datasetItems = await datasetResponse.json();
        
        if (datasetItems && datasetItems.length > 0) {
            const item = datasetItems[0];
            if (item.error_message) {
                throw new Error(item.error_message);
            }
            return {
                firstName: item.firstName,
                lastName: item.lastName,
                fullName: item.name,
                headline: item.headline,
                summary: item.summary || item.about,
                location: item.location,
                profilePicUrl: item.avatar,
                experiences: item.experience?.map((exp: any) => ({
                    title: exp.title,
                    company: exp.company,
                    duration: [exp.start_date, exp.end_date].filter(Boolean).join(' - '),
                    location: exp.location
                }))
            };
        }

        return null;
    } catch (e) {
        console.error("Apify Scraping Error:", e);
        throw e;
    }
};
