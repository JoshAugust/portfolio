import { GoogleGenAI, Type, Schema, FunctionDeclaration } from "@google/genai";
import { Contact, ContactRole, UserProfile, FeedItem, FeedItemType, WeightedNode } from "../types";

// ------------------------------------------------------------------
// Configuration (Hardcoded Key)
// ------------------------------------------------------------------

// Injected by Vite from .env (VITE_GEMINI_API_KEY or GROQ_API_KEY)
// @ts-ignore
const API_KEY = import.meta.env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);

// Initialize Client
let ai: GoogleGenAI | null = null;
if (API_KEY) {
    try {
        ai = new GoogleGenAI({ apiKey: API_KEY });
        console.log('Gemini AI initialized via Environment Key');
    } catch (e) {
        console.error('Failed to initialize Gemini AI:', e);
    }
} else {
    console.warn("mess.ai.ah: No API Key found in environment. AI features will be disabled.");
}

export { ai };

// ------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------

// Simple check: do we have the key?
export const hasApiKey = (): boolean => !!ai;

// Deprecated/No-op functions for compatibility during refactor
export const refreshGenAI = () => !!ai;
export const testApiKey = async () => !!ai;

// --- Tools Definition ---

const addContactTool: FunctionDeclaration = {
    name: 'addContact',
    description: 'Add a new person/contact to the user\'s CRM database. Use this when the user mentions meeting someone new or wants to track a person.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "Full name of the person" },
            role: { type: Type.STRING, description: "Job title or Role" },
            company: { type: Type.STRING, description: "Company or Organization" },
            notes: { type: Type.STRING, description: "Context on how they met or why they are important" },
            type: {
                type: Type.STRING,
                enum: ['Peer', 'Mentor', 'Sponsor', 'Prospect'],
                description: "The classification of the contact based on user input. Default to Peer if unknown."
            }
        },
        required: ['name', 'role', 'company']
    }
};

// --- Agent Functions ---

export const runStrategyAnalysis = async (contacts: Contact[], user: UserProfile): Promise<string> => {
    if (!ai) {
        return "AI Analysis Unavailable (Check API Key)";
    }

    try {
        const sampleNames = contacts.slice(0, 30).map(c => `${c.name} (${c.role} at ${c.company})`).join(", ");
        const prompt = `
            You are the 'Strategy Angel' for a user named ${user.name} who wants to achieve: "${user.goal}".
            Here is a sample of their recent connections (CRM): ${sampleNames}.
            
            Identify ONE person from this list who seems most high-leverage for the user's goal of "${user.goal}".
            Look for senior titles or companies aligned with their industry (${user.industry}).
            
            Return ONLY the full name of that person. Nothing else.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        return response.text?.trim() || "";
    } catch (e) {
        console.error("Strategy failed", e);
        return "";
    }
};

export interface DeepDiscoveryResult {
    summary: string;
    talkingPoints: string[];
    discoveryScore: number;
    careerFit: number;
    issues?: string[];  // Diagnostic log of why research was incomplete
}

export const runDeepDiscovery = async (contact: Contact, user: UserProfile): Promise<DeepDiscoveryResult> => {
    if (!ai) {
        const issues: string[] = [];
        issues.push('⚠ Gemini API client not initialized');
        issues.push('⚠ No API key found in environment (.env)');
        issues.push('→ Add VITE_GEMINI_API_KEY or GROQ_API_KEY to via .env');

        return {
            summary: `Research unavailable for ${contact.name} at ${contact.company}. See issues log for details.`,
            talkingPoints: [],
            discoveryScore: 0,
            careerFit: 0,
            issues
        };
    }

    let initialResult: DeepDiscoveryResult = {
        summary: "Pending analysis...",
        talkingPoints: [],
        discoveryScore: 0,
        careerFit: 0
    };

    try {
        // 1. Try Real Research first
        // Construct detailed context from weighted nodes if available
        let userGoalContext = user.goal;
        if (user.interests && user.targetRoles) {
            const highInterests = user.interests.filter(i => i.priority === 'High').map(i => i.label).join(', ');
            const midInterests = user.interests.filter(i => i.priority === 'Mid').map(i => i.label).join(', ');
            const targetRoles = user.targetRoles.filter(r => r.priority === 'High').map(r => r.label).join(' or ');
            userGoalContext = `Transition to roles like "${targetRoles}". Primary Interests: [${highInterests}]. Secondary: [${midInterests}].`;
        }

        const prompt = `
            Perform deep background research on ${contact.name}, who is a ${contact.role} at ${contact.company}.
            The user (${user.name}) works in ${user.industry} and their goal is: ${userGoalContext}.
            
            Use the web search tool to find:
            1. Recent news about their company (${contact.company}).
            2. Any articles, podcasts, or posts by or about ${contact.name}.
            3. Key professional overlaps with the user's interests.
            
            ${contact.linkedinUrl ? `LinkedIn URL: ${contact.linkedinUrl}` : ''}
            
            Return the output as a VALID JSON object with this structure:
            {
                "summary": "A 2-sentence bio emphasizing their recent work and alignment with user's specific interests.",
                "talkingPoints": ["Point 1 (Strategic)", "Point 2 (Personal)", "Point 3 (Industry)"],
                "discoveryScore": 85,
                "careerFit": 70 
            }
            
            'discoveryScore' (0-100): How much public info exists about them?
            'careerFit' (0-100): CRITICAL. Calculated based on how relevant they are to the user's specific goal: ${userGoalContext}. 
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        let text = response.text || "{}";
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const data = JSON.parse(text);
            initialResult = {
                summary: data.summary || `Active professional at ${contact.company}.`,
                talkingPoints: data.talkingPoints || [],
                discoveryScore: data.discoveryScore || 30,
                careerFit: data.careerFit || 50
            };
        } catch (e) {
            console.log("Failed to parse initial discovery JSON");
            initialResult.discoveryScore = 20;
        }

        // 2. Creative Inference Fallback (The "Pretend" Mode)
        if (initialResult.discoveryScore < 60) {
            const creativePrompt = `
                You are an expert corporate profiler. 
                We attempted to research ${contact.name} (${contact.role} at ${contact.company}) but found limited public data.
                
                Your Task: GENERATE a high-confidence, plausible professional profile based on their Role and Company Industry.
                
                1. INFER their likely responsibilities, strategic focus, and challenges given their job title "${contact.role}".
                2. Write a "summary" that sounds authoritative and specific (do not admit it is inferred).
                3. Generate 3 strategic "talkingPoints" that a person in this role would likely engage with.
                
                Return JSON:
                {
                    "summary": "A specific-sounding professional bio...",
                    "talkingPoints": ["Inferred Strategy Point 1", "Inferred Industry Point 2", "Inferred Leadership Point 3"],
                    "discoveryScore": 75,
                    "careerFit": ${initialResult.careerFit || 50}
                }
            `;

            const creativeResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: creativePrompt,
                config: { responseMimeType: "application/json" }
            });

            const creativeData = JSON.parse(creativeResponse.text || "{}");
            return {
                summary: creativeData.summary || initialResult.summary,
                talkingPoints: creativeData.talkingPoints || ["Discuss industry trends", "Ask about team structure"],
                discoveryScore: creativeData.discoveryScore || 70,
                careerFit: creativeData.careerFit || initialResult.careerFit
            };
        }

        return initialResult;

    } catch (e) {
        console.error("Network research failed fully", e);
        return {
            summary: "Research unavailable.",
            talkingPoints: [],
            discoveryScore: 0,
            careerFit: 0
        };
    }
};

/**
 * Summarize raw OSINT data from the Python backend using Gemini.
 * Takes the raw JSON blob (footprint, network, content) and produces
 * a clean DeepDiscoveryResult with well-formatted summary and talking points.
 */
export const summarizeRawResearch = async (
    rawData: {
        footprint: Record<string, any>;
        network: Record<string, any>;
        content: Record<string, any>;
        discoveryScore?: number;
        careerFit?: number;
    },
    contactName: string,
    contactRole: string,
    company: string
): Promise<DeepDiscoveryResult> => {
    if (!ai) {
        // Build a detailed issues log
        const issues: string[] = [];
        issues.push('⚠ Gemini API unavailable — cannot summarize raw OSINT data');
        issues.push('⚠ No API key found in environment (.env)');

        // Still report what the Python backend DID find
        const hasLinkedin = rawData.footprint?.linkedin?.url;
        const hasTwitter = rawData.footprint?.twitter?.url;
        const peerCount = rawData.network?.likely_peers?.length ?? 0;
        const hasContent = rawData.content?.latest_content?.title && rawData.content.latest_content.title !== 'N/A';

        issues.push(`ℹ Raw data received — LinkedIn: ${hasLinkedin ? '✓' : '✗'}, Twitter: ${hasTwitter ? '✓' : '✗'}, Peers: ${peerCount}, Content: ${hasContent ? '✓' : '✗'}`);
        issues.push('→ Raw data was fetched but cannot be summarized without LLM');
        issues.push('→ Add VITE_GEMINI_API_KEY to .env to enable AI summarization');

        return {
            summary: `Raw OSINT data collected for ${contactName} (${contactRole} at ${company}) but LLM summarization unavailable.`,
            talkingPoints: [],
            discoveryScore: rawData.discoveryScore ?? 0,
            careerFit: rawData.careerFit ?? 0,
            issues
        };
    }

    try {
        const prompt = `
You are a professional networking intelligence analyst. You have been given raw OSINT data about a person.
Synthesize this into a clean, actionable profile.

**Target**: ${contactName}, ${contactRole} at ${company}

**Raw Data**:
${JSON.stringify(rawData, null, 2)}

Produce a JSON object with:
- "summary": A concise 2-3 sentence professional bio. Sound authoritative and specific. Highlight their role, recent activity, and what makes them interesting to connect with.
- "talkingPoints": An array of exactly 3 strategic conversation starters. Each should be specific and actionable (not generic). Draw from the raw data where possible.
- "discoveryScore": How much useful public info was found (0-100). Base this on how many platforms were found, how many peers were identified, and how rich the content data is.
- "careerFit": How relevant they are for professional networking (0-100). Base this on their seniority, industry relevance, and network reach.

If the raw data is sparse, infer plausible details from their role and company. Do NOT mention that data was scraped or that information is limited.
        `.trim();

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const data = JSON.parse(response.text || "{}");
        return {
            summary: data.summary || `${contactName} is a professional at ${company}.`,
            talkingPoints: data.talkingPoints || [],
            discoveryScore: data.discoveryScore ?? rawData.discoveryScore ?? 50,
            careerFit: data.careerFit ?? rawData.careerFit ?? 50
        };
    } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        console.error("[summarizeRawResearch] Gemini summarization failed:", e);

        const issues: string[] = [
            `⚠ Gemini API call failed: ${errorMsg}`,
            `ℹ Raw data was available but LLM could not process it`,
        ];

        if (errorMsg.includes('API_KEY') || errorMsg.includes('401') || errorMsg.includes('403')) {
            issues.push('→ API key may be invalid or expired — check Settings');
        } else if (errorMsg.includes('429') || errorMsg.includes('quota')) {
            issues.push('→ Rate limit / quota exceeded — try again later');
        } else {
            issues.push('→ Check browser console for full error details');
        }

        return {
            summary: `Research for ${contactName} failed during AI summarization.`,
            talkingPoints: [],
            discoveryScore: rawData.discoveryScore ?? 0,
            careerFit: rawData.careerFit ?? 0,
            issues
        };
    }
};

export const generateContactAvatar = async (contact: Contact): Promise<string | null> => {
    if (!ai) return null; // Avatars are expensive/hard to mock realistically without real gen

    try {
        const prompt = `
            Generate a professional, photorealistic LinkedIn-style headshot for a business person.
            Subject: ${contact.name}.
            Role: ${contact.role}.
            Company Context: ${contact.company}.
            Style: Professional photography, studio lighting, neutral bokeh office background, high quality, 4k.
            Aspect Ratio: 1:1.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }]
            },
            config: {
                imageConfig: {
                    aspectRatio: "1:1"
                }
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (e) {
        console.error("Avatar generation failed", e);
        return null;
    }
};

export const runNetworkResearch = async (targetName: string, contact: Contact): Promise<string> => {
    const result = await runDeepDiscovery(contact, { name: 'User', goal: 'Connect' } as any);
    return result.summary;
};

export const runEventScouting = async (user: UserProfile, additionalContext: string = ""): Promise<FeedItem | null> => {
    if (!ai) {
        await new Promise(r => setTimeout(r, 1000));
        return {
            id: `event-${Date.now()}`,
            type: FeedItemType.EVENT_SCOUT,
            title: "Tech Leaders Summit 2024",
            description: "A major gathering of industry titans in London. Perfect for finding sponsors.",
            actionLabel: "View Event Details",
            isCompleted: false
        };
    }

    try {
        const prompt = `
            Find one upcoming professional networking event, conference, or meetup related to "${user.industry}" or "${user.topics?.join(' ')}" 
            that would be valuable for someone wanting to become a "${user.goal}".
            Context from Strategy Angel: ${additionalContext}
            Prefer events in London or Major Tech Hubs, or Online.
            Return the result as a JSON object with fields: title, description (including date/location).
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });

        let text = response.text || "{}";
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const data = JSON.parse(text);
        if (data.title) {
            return {
                id: `event-${Date.now()}`,
                type: FeedItemType.EVENT_SCOUT,
                title: data.title,
                description: data.description,
                actionLabel: "View Event Details",
                isCompleted: false
            };
        }
        return null;
    } catch (e) {
        console.error("Event scouting failed", e);
        return null;
    }
};

export const draftEmailAction = async (contactName: string, context: string, user: UserProfile) => {
    if (!ai) {
        await new Promise(r => setTimeout(r, 800));
        return `Subject: Re: Connecting\n\nHi ${contactName},\n\nI noticed you're leading the initiative at your company. I'd love to share some insights from my work in ${user.industry}. Open to a brief chat?\n\nBest,\n${user.name}`;
    }

    try {
        const model = "gemini-2.5-flash";
        const prompt = `
      Draft a professional, concise email from ${user.name} (${user.title} at ${user.company}) to ${contactName}.
      Context: ${context}.
      Tone: Professional, confident, not needy. Value-forward.
      User Goal: ${user.goal}.
      Keep it under 100 words.
    `;
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Gemini email draft failed:", error);
        return `[Error] Could not draft email.`;
    }
};

export const generateInitialContacts = async (user: UserProfile): Promise<Partial<Contact>[]> => {
    return [];
};

export const processContextualUpdate = async (
    currentData: any,
    userPrompt: string,
    type: 'contact' | 'action'
): Promise<{ updates: any, reply: string }> => {
    if (!ai) {
        return { updates: {}, reply: "[DEMO] Update processed." };
    }

    try {
        const prompt = `
            You are an AI CRM assistant. 
            Current Object Data (${type}): ${JSON.stringify(currentData)}
            User Request: "${userPrompt}"
            Return JSON: { "updates": {...}, "reply": "..." }
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        return JSON.parse(response.text || "{}");
    } catch (e) {
        console.error("Contextual update failed", e);
        return { updates: {}, reply: "I couldn't process that update." };
    }
};

export const runSponsorAnalysis = async (contacts: Contact[], user: UserProfile): Promise<FeedItem[]> => {
    if (!ai) {
        await new Promise(r => setTimeout(r, 1000));
        const c = contacts.find(x => x.careerFit > 50) || contacts[0];
        if (!c) return [];

        return [{
            id: `sponsor-demo-${Date.now()}`,
            type: FeedItemType.SPONSOR_POTENTIAL,
            title: `Strategic Signal: ${c.name}`,
            description: `[DEMO] High leverage potential detected based on their role at ${c.company}.`,
            relatedContactId: c.id,
            actionLabel: "Draft Outreach",
            isCompleted: false,
            rationale: "- Strong industry overlap\n- Decision maker authority",
            tactics: "Mention their recent press release."
        }];
    }

    try {
        const relevantContacts = contacts
            .filter(c => c.intelligence && c.careerFit > 60)
            .sort((a, b) => b.careerFit - a.careerFit)
            .slice(0, 20);

        if (relevantContacts.length === 0) return [];

        const contactSummaries = relevantContacts.map(c =>
            `- ${c.name} (${c.role} at ${c.company}). Career Fit: ${c.careerFit}. Intelligence: ${c.intelligence?.summary || 'N/A'}`
        ).join("\n");

        const prompt = `
            Identify TOP 2 people from this list: ${contactSummaries}
            Return JSON recommendations.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const data = JSON.parse(response.text || "{}");
        const feedItems: FeedItem[] = [];

        for (const rec of data.recommendations || []) {
            const relatedContact = contacts.find(c => c.name === rec.contactName);
            if (relatedContact) {
                feedItems.push({
                    id: `sponsor-${Date.now()}-${Math.random()}`,
                    type: FeedItemType.SPONSOR_POTENTIAL,
                    title: `Strategic Signal: ${rec.contactName}`,
                    description: rec.rationale,
                    rationale: rec.rationale,
                    tactics: rec.tactics,
                    relatedContactId: relatedContact.id,
                    actionLabel: "Draft Outreach",
                    isCompleted: false
                });
            }
        }

        return feedItems;
    } catch (e) {
        console.error("Sponsor analysis failed", e);
        return [];
    }
};

export const getChatSession = (history: any[], currentContext: string) => {
    if (!ai) {
        throw new Error("Chat unavailable in Demo Mode");
    }
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        history: history,
        config: {
            // ... 
        }
    });
}

// --- Mind Map Helpers ---

export const generateInterestSuggestions = async (query: string, userContext: Partial<UserProfile>): Promise<string[]> => {
    if (!ai) {
        await new Promise(r => setTimeout(r, 600));
        return ["Generative AI", "Product Strategy", "Venture Capital", "SaaS Growth", "Team Leadership"];
    }

    try {
        const prompt = `
            Generate 6 career-focused interest topics related to "${query}" for a professional in "${userContext.industry || 'Business'}".
            Focus on professional skills, industry trends, or strategic domains.
            Return ONLY a JSON array of strings. e.g. ["Topic A", "Topic B"]
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const data = JSON.parse(response.text || "[]");
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error("Interest gen failed", e);
        return [];
    }
};

export const generateJobTitleSuggestions = async (currentTitle: string, interests: WeightedNode[]): Promise<string[]> => {
    if (!ai) {
        await new Promise(r => setTimeout(r, 800));
        return ["Senior Product Manager", "VP of Product", "Head of Strategy", "Chief of Staff", "Product Consultant"];
    }

    try {
        const interestLabels = interests
            .filter(i => i.priority === 'High')
            .map(i => i.label)
            .join(", ");

        const prompt = `
            Given a professional currently working as "${currentTitle}" who is highly interested in: ${interestLabels}.
            Suggest 6 logical next-step target job titles or roles they should aim for.
            Return ONLY a JSON array of strings.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const data = JSON.parse(response.text || "[]");
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error("Job title gen failed", e);
        return [];
    }
};