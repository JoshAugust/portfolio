import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WeightedNode, PriorityLevel } from '../../types';
import { Plus, X, Search, Sparkles, Trash2, MoreHorizontal, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';

interface MindMapBuilderProps {
    initialNodes?: WeightedNode[];
    rootLabel: string;
    onNodesChange: (nodes: WeightedNode[]) => void;
    onGenerateSuggestions: (query: string) => Promise<string[]>;
    placeholder?: string;
    customInputPlaceholder?: string;
}

const COLORS = {
    High: 'bg-cyan-500 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)]',
    Mid: 'bg-violet-500 border-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.6)]',
    Low: 'bg-slate-500 border-slate-400 shadow-[0_0_10px_rgba(100,116,139,0.5)]',
    Suggestion: 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:bg-cyan-900/50 hover:border-cyan-500/50 hover:text-cyan-200'
};

const TEXT_COLORS = {
    High: 'text-white font-bold',
    Mid: 'text-white font-semibold',
    Low: 'text-white',
    Suggestion: 'text-slate-500 hover:text-cyan-200'
};

const MindMapBuilder: React.FC<MindMapBuilderProps> = ({
    initialNodes = [],
    rootLabel,
    onNodesChange,
    onGenerateSuggestions,
    placeholder = "Start typing...",
    customInputPlaceholder = "Add another..."
}) => {
    const [nodes, setNodes] = useState<WeightedNode[]>(initialNodes);
    const [inputValue, setInputValue] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [suggestions, setSuggestions] = useState<WeightedNode[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Menu State
    const [menuNodeId, setMenuNodeId] = useState<string | null>(null);

    // Trigger suggestions when nodes change (with debounce or specific trigger)
    // For V1, we trigger when a node is added via input or suggestion click

    const addNode = (node: WeightedNode) => {
        const nextNodes = [...nodes, { ...node, priority: 'High' }]; // Default to High
        setNodes(nextNodes);
        onNodesChange(nextNodes);

        // Remove from suggestions if present
        setSuggestions(prev => prev.filter(n => n.label !== node.label));

        // Trigger new suggestions based on context
        triggerSuggestions(nextNodes);
    };

    const removeNode = (id: string) => {
        const nextNodes = nodes.filter(n => n.id !== id);
        setNodes(nextNodes);
        onNodesChange(nextNodes);
        setMenuNodeId(null);
    };

    const updatePriority = (id: string, priority: PriorityLevel) => {
        const nextNodes = nodes.map(n => n.id === id ? { ...n, priority } : n);
        setNodes(nextNodes);
        onNodesChange(nextNodes);
        setMenuNodeId(null);
    };

    const triggerSuggestions = async (currentNodes: WeightedNode[]) => {
        setIsGenerating(true);
        try {
            // Build a query context from the last 3 added nodes + root
            // Or just send the labels
            const contextLabels = currentNodes.slice(-3).map(n => n.label).join(', ');
            const query = contextLabels || rootLabel; // Fallback to root if empty

            const results = await onGenerateSuggestions(query);

            const existingLabels = new Set(currentNodes.map(n => n.label.toLowerCase()));
            const newSuggestions = results
                .filter(r => !existingLabels.has(r.toLowerCase()))
                .map(label => ({
                    id: `sugg-${label}-${Date.now()}`,
                    label,
                    priority: 'Low' as PriorityLevel,
                    parentId: 'context'
                }));

            setSuggestions(newSuggestions.slice(0, 6)); // Cap at 6 suggestions
        } catch (e) {
            console.error("Suggestion error", e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddCustom = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        // Check dupe
        if (nodes.some(n => n.label.toLowerCase() === inputValue.trim().toLowerCase())) {
            setInputValue('');
            return;
        }

        const newNode: WeightedNode = {
            id: `custom-${inputValue}-${Date.now()}`,
            label: inputValue.trim(),
            priority: 'High',
            parentId: 'root'
        };

        addNode(newNode);
        setInputValue('');
    };

    // --- Render ---

    // Helper to place nodes in a chaotic but centered cloud
    // We use a deterministic pseudo-random position based on index & ID hash to keep them stable
    const getPosition = (index: number, total: number, isSuggestion: boolean) => {
        // Active nodes: Inner circle(s)
        // Suggestions: Outer orbit background

        const radius = isSuggestion ? 35 : 22; // % active radius
        // Add some random offsets based on index to make it organic
        const offset = Math.sin(index * 99) * 10;

        const angle = (index / (total || 1)) * 2 * Math.PI + (isSuggestion ? 0.5 : 0);
        const x = 50 + Math.cos(angle) * (radius + (index % 2) * 5);
        const y = 50 + Math.sin(angle) * (radius + (index % 3) * 5) * 0.8; // Flatten y

        return { x: `${x}%`, y: `${y}%` };
    };

    return (
        <div className="flex flex-col h-full w-full relative group">
            {/* Canvas */}
            <div
                ref={containerRef}
                className="flex-1 bg-slate-950/80 rounded-xl relative overflow-hidden border border-slate-800 min-h-[400px] shadow-inner"
                onClick={() => setMenuNodeId(null)} // Click bg to close menu
            >
                <AnimatePresence>
                    {/* Suggestions Layer (Behind) */}
                    {suggestions.map((node, i) => {
                        const pos = getPosition(i, suggestions.length, true);
                        return (
                            <motion.button
                                key={node.id}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                    opacity: 0.4,
                                    scale: 0.8,
                                    left: pos.x,
                                    top: pos.y
                                }}
                                whileHover={{ opacity: 1, scale: 1, zIndex: 10 }}
                                className={`absolute -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full flex items-center justify-center p-2 text-xs text-center border cursor-pointer transition-all duration-300 ${COLORS.Suggestion}`}
                                onClick={(e) => { e.stopPropagation(); addNode(node); }}
                            >
                                {node.label}
                            </motion.button>
                        );
                    })}

                    {/* Root Node */}
                    <motion.div
                        layout
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
                    >
                        <div className="w-28 h-28 rounded-full bg-slate-900 border-4 border-slate-700 flex items-center justify-center shadow-2xl relative">
                            <span className="text-sm font-bold text-slate-300 text-center px-2">{rootLabel}</span>
                            {isGenerating && (
                                <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-ping"></div>
                            )}
                        </div>
                    </motion.div>

                    {/* Active Nodes */}
                    {nodes.map((node, i) => {
                        const pos = getPosition(i, nodes.length, false);
                        const isMenuOpen = menuNodeId === node.id;

                        return (
                            <motion.div
                                key={node.id}
                                layoutId={node.id}
                                initial={{ scale: 0 }}
                                animate={{
                                    scale: isMenuOpen ? 1.1 : 1,
                                    left: pos.x,
                                    top: pos.y
                                }}
                                className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
                            >
                                {/* Node Bubble */}
                                <motion.button
                                    onClick={(e) => { e.stopPropagation(); setMenuNodeId(isMenuOpen ? null : node.id); }}
                                    className={`w-24 h-24 rounded-full flex items-center justify-center p-3 text-sm text-center border-2 transition-all duration-300 ${COLORS[node.priority]} ${TEXT_COLORS[node.priority]}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {node.label}
                                </motion.button>

                                {/* Context Menu Pop-up */}
                                <AnimatePresence>
                                    {isMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-1 flex flex-col gap-1 w-32 z-50 backdrop-blur-md"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="text-[10px] text-slate-500 uppercase font-bold px-2 py-1 border-b border-slate-800 text-center">Priority</div>
                                            <button
                                                onClick={() => updatePriority(node.id, 'High')}
                                                className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-slate-800 ${node.priority === 'High' ? 'text-cyan-400 bg-cyan-900/20' : 'text-slate-300'}`}
                                            >
                                                <div className="w-2 h-2 rounded-full bg-cyan-500"></div> High
                                            </button>
                                            <button
                                                onClick={() => updatePriority(node.id, 'Mid')}
                                                className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-slate-800 ${node.priority === 'Mid' ? 'text-violet-400 bg-violet-900/20' : 'text-slate-300'}`}
                                            >
                                                <div className="w-2 h-2 rounded-full bg-violet-500"></div> Medium
                                            </button>
                                            <button
                                                onClick={() => updatePriority(node.id, 'Low')}
                                                className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-slate-800 ${node.priority === 'Low' ? 'text-slate-400 bg-slate-800' : 'text-slate-300'}`}
                                            >
                                                <div className="w-2 h-2 rounded-full bg-slate-500"></div> Low
                                            </button>
                                            <div className="h-px bg-slate-800 my-0.5"></div>
                                            <button
                                                onClick={() => removeNode(node.id)}
                                                className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-red-400 hover:bg-red-900/20 hover:text-red-300 w-full"
                                            >
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}

                </AnimatePresence>

                {/* Suggestion Hint */}
                {nodes.length > 0 && suggestions.length > 0 && (
                    <div className="absolute bottom-4 right-4 pointer-events-none text-slate-600 text-[10px] uppercase tracking-widest opacity-50">
                        Hover to reveal • Click to add
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="mt-4 relative z-30">
                <form onSubmit={handleAddCustom} className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={placeholder || customInputPlaceholder}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none shadow-lg"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    </div>
                    <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
                    >
                        <Plus size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MindMapBuilder;
