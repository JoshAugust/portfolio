import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { WeightedNode, PriorityLevel } from '../../types';
import { Plus, X, Search, Sparkles, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

interface PriorityBoardProps {
    initialNodes?: WeightedNode[];
    rootLabel: string;
    onNodesChange: (nodes: WeightedNode[]) => void;
    onGenerateSuggestions: (query: string) => Promise<string[]>;
    placeholder?: string;
}

const COLUMNS: { id: PriorityLevel; label: string; color: string; bg: string; border: string }[] = [
    { id: 'High', label: 'High Priority', color: 'text-cyan-400', bg: 'bg-cyan-950/30', border: 'border-cyan-500/30' },
    { id: 'Mid', label: 'Medium Priority', color: 'text-violet-400', bg: 'bg-violet-950/30', border: 'border-violet-500/30' },
    { id: 'Low', label: 'Low Priority', color: 'text-slate-400', bg: 'bg-slate-900/50', border: 'border-slate-800' }
];

const PriorityBoard: React.FC<PriorityBoardProps> = ({
    initialNodes = [],
    rootLabel,
    onNodesChange,
    onGenerateSuggestions,
    placeholder = "Add item..."
}) => {
    const [nodes, setNodes] = useState<WeightedNode[]>(initialNodes);
    const [inputValue, setInputValue] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    useEffect(() => {
        setNodes(initialNodes);
    }, [initialNodes]);

    // --- Actions ---

    const addNode = (label: string, priority: PriorityLevel = 'Mid') => {
        // Prevent dupes
        if (nodes.some(n => n.label.toLowerCase() === label.toLowerCase())) return;

        const newNode: WeightedNode = {
            id: `node-${label}-${Date.now()}`,
            label,
            priority,
            parentId: 'root'
        };

        const nextNodes = [...nodes, newNode];
        setNodes(nextNodes);
        onNodesChange(nextNodes);

        // Remove from suggestions if present
        setSuggestions(prev => prev.filter(s => s !== label));

        // Trigger new suggestions
        triggerSuggestions(nextNodes);
    };

    const removeNode = (id: string) => {
        const nextNodes = nodes.filter(n => n.id !== id);
        setNodes(nextNodes);
        onNodesChange(nextNodes);
    };

    const moveNode = (id: string, direction: 'up' | 'down') => {
        const node = nodes.find(n => n.id === id);
        if (!node) return;

        let newPriority: PriorityLevel = node.priority;
        if (direction === 'up') {
            if (node.priority === 'Low') newPriority = 'Mid';
            else if (node.priority === 'Mid') newPriority = 'High';
        } else {
            if (node.priority === 'High') newPriority = 'Mid';
            else if (node.priority === 'Mid') newPriority = 'Low';
        }

        if (newPriority !== node.priority) {
            moveNodeToColumn(id, newPriority);
        }
    };

    const moveNodeToColumn = (id: string, newPriority: PriorityLevel) => {
        const nextNodes = nodes.map(n => n.id === id ? { ...n, priority: newPriority } : n);
        setNodes(nextNodes);
        onNodesChange(nextNodes);
    };

    const triggerSuggestions = async (currentNodes: WeightedNode[]) => {
        // Debounce or just simplistic trigger logic
        if (isGenerating) return;

        setIsGenerating(true);
        try {
            const context = currentNodes.slice(-3).map(n => n.label).join(', ');
            const query = context || rootLabel;
            const results = await onGenerateSuggestions(query);

            // Filter out existing
            const existing = new Set(currentNodes.map(n => n.label.toLowerCase()));
            const fresh = results.filter(r => !existing.has(r.toLowerCase())).slice(0, 5);

            setSuggestions(fresh);
        } catch (e) {
            console.error("Failed to generate suggestions", e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            addNode(inputValue.trim(), 'High');
            setInputValue('');
        }
    };

    // Initial suggestions on mount if empty
    useEffect(() => {
        if (nodes.length > 0 && suggestions.length === 0) {
            triggerSuggestions(nodes);
        } else if (nodes.length === 0) {
            triggerSuggestions([]);
        }
    }, []);

    return (
        <div className="flex flex-col h-full w-full gap-6">

            {/* Input Area */}
            <div className="relative">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={placeholder}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none shadow-sm"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    </div>
                    <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add
                    </button>
                    <button
                        type="button"
                        onClick={() => triggerSuggestions(nodes)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 rounded-lg border border-slate-700 transition-colors"
                        title="Refresh Suggestions"
                    >
                        <Sparkles size={18} className={isGenerating ? "animate-spin text-amber-400" : ""} />
                    </button>
                </form>

                {/* Suggestions Bar */}
                {suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 animate-in fade-in slide-in-from-top-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider py-1.5 mr-2 flex items-center gap-1">
                            <Sparkles size={10} /> Suggested:
                        </span>
                        {suggestions.map((sugg) => (
                            <button
                                key={sugg}
                                onClick={() => addNode(sugg, 'Mid')}
                                className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800/50 hover:bg-cyan-900/30 text-slate-400 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/30 transition-all flex items-center gap-1 group"
                            >
                                <Plus size={10} className="group-hover:text-cyan-400" />
                                {sugg}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Columns Board */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0 overflow-hidden">
                {COLUMNS.map(col => (
                    <div key={col.id} className={`flex flex-col rounded-xl border ${col.border} ${col.bg} overflow-hidden`}>
                        {/* Column Header */}
                        <div className="p-3 border-b border-slate-800/50 flex items-center justify-between">
                            <h3 className={`text-sm font-bold ${col.color}`}>{col.label}</h3>
                            <span className="text-xs text-slate-600 font-mono">
                                {nodes.filter(n => n.priority === col.id).length}
                            </span>
                        </div>

                        {/* Column Content */}
                        <div className="flex-1 p-3 overflow-y-auto space-y-2 custom-scrollbar">
                            <AnimatePresence initial={false}>
                                {nodes.filter(n => n.priority === col.id).map((node) => (
                                    <motion.div
                                        key={node.id}
                                        layoutId={node.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-lg p-3 shadow-sm transition-all relative"
                                    >
                                        <div className="pr-6">
                                            <span className="text-sm text-slate-200 font-medium block break-words">{node.label}</span>
                                        </div>

                                        {/* Hover Actions */}
                                        <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 rounded">
                                            {/* Up Action */}
                                            {col.id !== 'High' && (
                                                <button
                                                    onClick={() => moveNode(node.id, 'up')}
                                                    className="p-1 text-slate-500 hover:text-cyan-400 hover:bg-slate-800 rounded"
                                                    title="Promote Priority"
                                                >
                                                    <ArrowUp size={12} />
                                                </button>
                                            )}

                                            {/* Down Action */}
                                            {col.id !== 'Low' && (
                                                <button
                                                    onClick={() => moveNode(node.id, 'down')}
                                                    className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded"
                                                    title="Lower Priority"
                                                >
                                                    <ArrowDown size={12} />
                                                </button>
                                            )}

                                            {/* Delete Action */}
                                            <button
                                                onClick={() => removeNode(node.id)}
                                                className="p-1 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded"
                                                title="Remove"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {nodes.filter(n => n.priority === col.id).length === 0 && (
                                <div className="text-center py-8 opacity-30">
                                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 mx-4">
                                        <span className="text-xs text-slate-500">Empty</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default PriorityBoard;
