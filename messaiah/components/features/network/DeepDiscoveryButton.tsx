import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Contact } from '../../../types';
import { fetchRawEnrichment } from '../../../services/searchService';
import { useApp } from '../../../context/AppContext';
import { Radar, Check, AlertCircle } from 'lucide-react';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

type ScanPhase = 'idle' | 'scanning' | 'success' | 'error';

interface DeepDiscoveryButtonProps {
    contact: Contact;
    onUpdate: (id: string, updates: Partial<Contact>) => void;
    /** True while the global discovery engine is processing THIS contact */
    isEngineProcessing?: boolean;
}

// ------------------------------------------------------------------
// Scanning Labels (cycled sequentially)
// ------------------------------------------------------------------

const SCAN_LABELS = [
    'Verifying Identity…',
    'Scanning Digital Footprint…',
    'Mapping Network…',
    'Analyzing Content…',
    'Synthesizing with AI…',
    'Building Profile…',
];

const CYCLE_INTERVAL_MS = 2_400;
const SUCCESS_DISPLAY_MS = 3_000;

// ------------------------------------------------------------------
// Keyframe styles (injected once into <head>)
// ------------------------------------------------------------------

const ANIM_STYLE_ID = 'deep-discovery-anims';

function ensureAnimStyles() {
    if (document.getElementById(ANIM_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = ANIM_STYLE_ID;
    style.textContent = `
        @keyframes dd-spin { to { transform: rotate(360deg); } }
        @keyframes dd-pulse-ring {
            0%   { transform: scale(0.8); opacity: 0.6; }
            50%  { transform: scale(1.4); opacity: 0; }
            100% { transform: scale(0.8); opacity: 0; }
        }
        @keyframes dd-pop {
            0%   { transform: scale(0); opacity: 0; }
            50%  { transform: scale(1.3); }
            100% { transform: scale(1); opacity: 1; }
        }
        @keyframes dd-label-in {
            0%   { opacity: 0; transform: translateY(6px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes dd-check-ring {
            0%   { transform: scale(0.5); opacity: 0.8; }
            100% { transform: scale(2.2); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------

const DeepDiscoveryButton: React.FC<DeepDiscoveryButtonProps> = ({
    contact,
    onUpdate,
    isEngineProcessing = false,
}) => {
    const { user } = useApp();
    const [phase, setPhase] = useState<ScanPhase>('idle');
    const [labelIdx, setLabelIdx] = useState(0);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Inject keyframe CSS once
    useEffect(() => ensureAnimStyles(), []);

    // ---- Cycle labels while scanning ----
    useEffect(() => {
        if (phase !== 'scanning') return;
        setLabelIdx(0);
        const interval = setInterval(() => {
            setLabelIdx((prev) => (prev + 1) % SCAN_LABELS.length);
        }, CYCLE_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [phase]);

    // ---- Auto-dismiss success ----
    useEffect(() => {
        if (phase !== 'success') return;
        const timer = setTimeout(() => setPhase('idle'), SUCCESS_DISPLAY_MS);
        return () => clearTimeout(timer);
    }, [phase]);

    // ---- Track engine processing → show scanning state ----
    useEffect(() => {
        if (isEngineProcessing) {
            setPhase('scanning');
        } else if (phase === 'scanning' && !isEngineProcessing) {
            setPhase('success');
        }
    }, [isEngineProcessing]);

    // ---- Cleanup abort on unmount ----
    useEffect(() => {
        return () => abortRef.current?.abort();
    }, []);

    // ---- Trigger deep scan (Python backend + Groq summarization) ----
    const handleClick = useCallback(async () => {
        if (phase === 'scanning') return;
        setPhase('scanning');
        setErrorMsg(null);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            // Call Python backend — runs OSINT modules + Groq summarization
            const rawData = await fetchRawEnrichment(contact.name, contact.company);

            if (controller.signal.aborted) return;

            if (!rawData) {
                throw new Error('Python backend unavailable — ensure server.py is running on :8000');
            }

            // Map the Python response directly onto Contact updates
            const summary = rawData.summary;
            const summaryText = summary
                ? `${summary.role ? summary.role + '. ' : ''}${summary.bullets?.join(' ') || ''}`
                : `OSINT data collected for ${contact.name} at ${contact.company}.`;

            const talkingPoints = summary?.bullets || [];

            onUpdate(contact.id, {
                discoveryScore: rawData.discoveryScore ?? 0,
                careerFit: rawData.careerFit ?? 0,
                intelligence: {
                    summary: summaryText,
                    talkingPoints: talkingPoints,
                    lastScouted: Date.now(),
                },
                needsResearch: (rawData.discoveryScore ?? 0) < 30,
                manualResearchRequested: false,
                // Preserve LinkedIn URL from raw data if available
                ...(rawData.footprint?.linkedin?.url
                    ? { linkedinUrl: rawData.footprint.linkedin.url }
                    : {}),
            });
            setPhase('success');
        } catch (err) {
            if (controller.signal.aborted) return;
            console.error('[DeepDiscoveryButton] Scan failed:', err);
            setErrorMsg(err instanceof Error ? err.message : 'Scan failed');
            setPhase('error');
            setTimeout(() => {
                setPhase('idle');
                setErrorMsg(null);
            }, 3000);
        }
    }, [phase, contact.id, contact.name, contact.role, contact.company, onUpdate, user]);

    // ------------------------------------------------------------------
    // RENDER — scanning state
    // ------------------------------------------------------------------
    if (phase === 'scanning' || isEngineProcessing) {
        return (
            <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/50 border border-cyan-500/30">
                {/* Pulse ring behind icon */}
                <span
                    className="absolute left-3 w-4 h-4 rounded-full bg-cyan-400/30"
                    style={{ animation: 'dd-pulse-ring 1.5s ease-out infinite' }}
                />
                {/* Rotating radar icon */}
                <Radar
                    size={14}
                    className="text-cyan-400 relative z-10"
                    style={{ animation: 'dd-spin 2s linear infinite' }}
                />
                {/* Cycling label with slide-up transition */}
                <span
                    key={labelIdx}
                    className="text-[10px] font-semibold text-cyan-300 tracking-wide whitespace-nowrap"
                    style={{ animation: 'dd-label-in 0.3s ease-out' }}
                >
                    {SCAN_LABELS[labelIdx]}
                </span>
            </div>
        );
    }

    // ------------------------------------------------------------------
    // RENDER — success state
    // ------------------------------------------------------------------
    if (phase === 'success') {
        return (
            <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30">
                {/* Expanding ring behind checkmark */}
                <span
                    className="absolute left-3 w-4 h-4 rounded-full border-2 border-emerald-400"
                    style={{ animation: 'dd-check-ring 0.6s ease-out forwards' }}
                />
                {/* Pop-in checkmark */}
                <Check
                    size={14}
                    className="text-emerald-400 relative z-10"
                    style={{ animation: 'dd-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
                />
                <span className="text-[10px] font-bold text-emerald-300 tracking-wide">
                    Enriched!
                </span>
            </div>
        );
    }

    // ------------------------------------------------------------------
    // RENDER — error state
    // ------------------------------------------------------------------
    if (phase === 'error') {
        return (
            <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/50 border border-red-500/30"
                title={errorMsg || undefined}
            >
                <AlertCircle size={14} className="text-red-400" />
                <span className="text-[10px] font-semibold text-red-300 tracking-wide">
                    Failed
                </span>
            </div>
        );
    }

    // ------------------------------------------------------------------
    // RENDER — idle state (actionable button)
    // ------------------------------------------------------------------
    const needsResearch = contact.needsResearch && !contact.manualResearchRequested;

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                handleClick();
            }}
            className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all duration-200 ${needsResearch
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-500/10'
                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-400/40 hover:shadow-lg hover:shadow-cyan-500/10'
                }`}
            title={needsResearch ? 'Limited info — click for deep scan' : 'Run deep discovery scan'}
        >
            {needsResearch ? (
                <>
                    <AlertCircle size={12} className="animate-pulse" />
                    <span>Scan</span>
                </>
            ) : (
                <>
                    <Radar size={12} className="group-hover:rotate-90 transition-transform duration-300" />
                    <span>Deep Scan</span>
                </>
            )}
        </button>
    );
};

export default DeepDiscoveryButton;
