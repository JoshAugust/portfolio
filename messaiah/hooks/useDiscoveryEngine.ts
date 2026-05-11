import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Contact, UserProfile, FeedItem, FeedItemType, AngelState, ContactRole } from '../types';
import { runDeepDiscovery, generateContactAvatar, runSponsorAnalysis, runEventScouting } from '../services/geminiService';

interface DiscoveryEngineProps {
    user: UserProfile | null;
    contacts: Contact[];
    setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
    feedItems: FeedItem[];
    setFeedItems: React.Dispatch<React.SetStateAction<FeedItem[]>>;
    updateContact: (id: string, updates: Partial<Contact>) => void;
}

export const useDiscoveryEngine = ({
    user,
    contacts,
    setContacts,
    feedItems,
    setFeedItems,
    updateContact
}: DiscoveryEngineProps) => {
    // --- Local State for the Engine ---
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(true);
    const [isSponsorHunting, setIsSponsorHunting] = useState(false);
    const [processingContactId, setProcessingContactId] = useState<string | null>(null);
    const [researchedCount, setResearchedCount] = useState(0);

    // --- Angel Status States ---
    const [strategyAngel, setStrategyAngel] = useState<AngelState>({
        id: 'strategy', name: 'Strategy Angel', status: 'idle', currentTask: 'Waiting...'
    });
    const [networkAngel, setNetworkAngel] = useState<AngelState>({
        id: 'network', name: 'Network Angel', status: 'idle', currentTask: 'Waiting...'
    });
    const [eventsAngel, setEventsAngel] = useState<AngelState>({
        id: 'events', name: 'Events Angel', status: 'idle', currentTask: 'Waiting...'
    });

    const isPausedRef = useRef(false);

    // --- Actions ---

    const trigger = useCallback(() => {
        console.log("[Engine] Triggering Discovery Loop...");
        if (!isRunning) {
            setIsRunning(true);
            setIsPaused(false);
            isPausedRef.current = false;
            setStrategyAngel(p => ({ ...p, status: 'thinking', currentTask: 'Scanning grid layout...' }));
        }
    }, [isRunning]);

    const setPaused = useCallback((shouldPause: boolean) => {
        setIsPaused(shouldPause);
        isPausedRef.current = shouldPause;

        if (shouldPause) {
            // Pausing
            setStrategyAngel(p => ({ ...p, status: 'paused', currentTask: 'Paused by user.' }));
            setNetworkAngel(p => ({ ...p, status: 'paused', currentTask: 'Paused by user.' }));
            setEventsAngel(p => ({ ...p, status: 'paused', currentTask: 'Paused by user.' }));
        } else {
            // Resuming
            setStrategyAngel(p => ({ ...p, status: 'idle', currentTask: 'Resuming operations...' }));
            setNetworkAngel(p => ({ ...p, status: 'idle', currentTask: 'Resuming operations...' }));
            if (isRunning) trigger();
        }
    }, [isRunning, trigger]);

    // --- Effects / Loops ---

    // 1. Sponsor Hunting Cycle (Recurring)
    useEffect(() => {
        if (isPaused || !user || !isRunning) return;

        // Trigger every 5 items or if explicitly requested (could add manual trigger later)
        // Using 5 instead of 10 for faster feedback in this demo
        const shouldHunt = researchedCount > 0 && researchedCount % 5 === 0 && !isSponsorHunting;

        if (shouldHunt) {
            const runSponsorPhase = async () => {
                console.log("[Engine] Starting Sponsor Hunt...");
                setIsSponsorHunting(true);
                // Temporarily pause specific contact research

                setStrategyAngel(p => ({ ...p, status: 'working', currentTask: `Analyzing batch of ${contacts.length} for patterns...` }));
                setNetworkAngel(p => ({ ...p, status: 'idle', currentTask: 'Awaiting Strategy...' }));

                try {
                    // Run analysis
                    const sponsorItems = await runSponsorAnalysis(contacts, user);

                    if (sponsorItems.length > 0) {
                        setFeedItems(prev => {
                            // Deduplicate or merge logic could go here
                            const currentIds = new Set(prev.map(i => i.id));
                            const newItems = sponsorItems.filter(i => !currentIds.has(i.id));
                            return [...newItems, ...prev];
                        });

                        setStrategyAngel(p => ({ ...p, status: 'success', currentTask: `Identified ${sponsorItems.length} opportunities` }));

                        // Events Angel Follow-up
                        setEventsAngel(p => ({ ...p, status: 'working', currentTask: 'Triangulating relevant events...' }));
                        const context = sponsorItems.map(i => i.description).join(" ");
                        const eventItem = await runEventScouting(user, `Given these opportunities: ${context}`);

                        if (eventItem) {
                            setFeedItems(prev => [eventItem, ...prev]);
                            setEventsAngel(p => ({ ...p, status: 'success', currentTask: 'Route plotted' }));
                        }
                    } else {
                        setStrategyAngel(p => ({ ...p, status: 'idle', currentTask: 'No new strategic signals.' }));
                    }
                } catch (e) {
                    console.error("Sponsor hunt failed", e);
                    setStrategyAngel(p => ({ ...p, status: 'idle', currentTask: 'Analysis interrupted.' }));
                } finally {
                    // Resume normal Service
                    setTimeout(() => {
                        setIsSponsorHunting(false);
                        setStrategyAngel(p => ({ ...p, status: 'idle', currentTask: 'Monitoring' }));
                    }, 3000);
                }
            };

            runSponsorPhase();
        }
    }, [researchedCount, isSponsorHunting, isPaused, user, isRunning, contacts, setFeedItems]);


    // 2. Main Discovery Loop (Individual Contact Research)
    useEffect(() => {
        if (!isRunning || !user || isPaused) return;
        if (processingContactId) return; // Busy
        if (isSponsorHunting) return; // Busy

        // Selection Logic: Prioritize manual research requests first
        let target: Contact | undefined;

        // 1. Check for manual research requests (highest priority)
        const manualRequests = contacts.filter(c => c.manualResearchRequested);
        if (manualRequests.length > 0) {
            target = manualRequests[0]; // Take the first one
            setNetworkAngel(p => ({ ...p, status: 'working', currentTask: `Priority re-research: ${target.name}` }));
        } else {
            // 2. Normal research queue: low info contacts
            const eligibleTargets = contacts.filter(c => !c.intelligence && c.discoveryScore < 80);

            if (eligibleTargets.length === 0) {
                // Nothing left to research
                setIsRunning(false);
                setNetworkAngel(p => ({ ...p, status: 'success', currentTask: 'Grid fully mapped.' }));
                return;
            }

            // Pick random target from normal queue
            target = eligibleTargets[Math.floor(Math.random() * eligibleTargets.length)];
        }

        if (!target) return;

        const processTarget = async (c: Contact) => {
            setProcessingContactId(c.id);
            setNetworkAngel(p => ({ ...p, status: 'working', currentTask: `Deep diving: ${c.name}...` }));
            setStrategyAngel(p => ({ ...p, status: 'idle', currentTask: `Observing ${c.name}` }));

            try {
                // Check pause before expensive operation
                if (isPausedRef.current) {
                    setProcessingContactId(null);
                    return;
                }
                // Parallelize Image Gen and Text Discovery for speed
                const discoveryPromise = runDeepDiscovery(c, user);

                let avatarPromise = Promise.resolve(null as string | null);
                if (!c.avatarImage) {
                    avatarPromise = generateContactAvatar(c);
                }

                const [discoveryResult, avatarResult] = await Promise.all([discoveryPromise, avatarPromise]);

                // Determine if research was insufficient
                const needsResearch = discoveryResult.discoveryScore < 30;

                // Update Contact
                updateContact(c.id, {
                    discoveryScore: discoveryResult.discoveryScore,
                    careerFit: discoveryResult.careerFit,
                    intelligence: {
                        summary: discoveryResult.summary,
                        talkingPoints: discoveryResult.talkingPoints,
                        lastScouted: Date.now()
                    },
                    needsResearch: needsResearch,
                    manualResearchRequested: false, // Clear the manual request flag
                    ...(avatarResult ? { avatarImage: avatarResult } : {})
                });

                setResearchedCount(prev => prev + 1);
                setNetworkAngel(p => ({ ...p, status: 'success', currentTask: `Enriched ${c.name}` }));

            } catch (e) {
                console.error(`Error processing ${c.name}`, e);
                setNetworkAngel(p => ({ ...p, status: 'idle', currentTask: `Connection lost: ${c.name}` }));
            } finally {
                setTimeout(() => {
                    setProcessingContactId(null);
                }, 1500); // Pacing
            }
        };

        processTarget(target);

    }, [isRunning, isPaused, user, contacts, processingContactId, isSponsorHunting, updateContact]);


    return {
        angels: {
            strategy: strategyAngel,
            network: networkAngel,
            events: eventsAngel
        },
        isRunning,
        isPaused,
        trigger,
        setPaused,
        processingContactId
    };
};
