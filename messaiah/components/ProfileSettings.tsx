import React, { useState } from 'react';
import { UserProfile } from '../types';
import { useApp } from '../context/AppContext';
import { X, Save, User, Briefcase, Target, Building2, Linkedin, BrainCircuit, Trash2, AlertTriangle } from 'lucide-react';
import MindMapBuilder from './common/MindMapBuilder';

interface ProfileSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ isOpen, onClose }) => {
    const { user, setUser, resetAllData } = useApp();

    // Initialize state with user data
    const [formData, setFormData] = useState<UserProfile>(user || {
        name: '',
        title: '',
        company: '',
        industry: '',
        linkedinUrl: '',
        interests: [],
        targetRoles: [],
        // Derived/Legacy
        goal: '',
        challenge: '',
        topics: []
    });
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    // Sync when user prop updates
    React.useEffect(() => {
        if (user) setFormData(user);
    }, [user, isOpen]);

    // Handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleInterestChange = (newNodes: any[]) => {
        setFormData(prev => ({ ...prev, interests: newNodes }));
    };

    const handleRoleChange = (newNodes: any[]) => {
        setFormData(prev => ({ ...prev, targetRoles: newNodes }));
    };

    const handleSave = () => {
        // Construct derived legacy fields for compatibility
        const topRoles = formData.targetRoles.filter(r => r.priority === 'High').map(r => r.label).join(' or ');
        const topInterests = formData.interests.filter(i => i.priority === 'High').map(i => i.label).join(', ');
        const goalString = `Transition to ${topRoles || 'a new role'} with a focus on ${topInterests}.`;

        const updatedProfile = {
            ...formData,
            goal: goalString,
            topics: formData.interests.map(i => i.label)
        };

        setUser(updatedProfile);
        // Firestore auto-save will handle persistence via AppContext
        onClose();
    };

    // Generators for Settings (reuse same service functions)
    const handleInterestSuggestions = async (query: string) => {
        // We can import these from geminiService
        const { generateInterestSuggestions } = await import('../services/geminiService');
        return generateInterestSuggestions(query, { industry: formData.industry });
    };

    const handleJobTitleSuggestions = async (query: string) => {
        const { generateJobTitleSuggestions } = await import('../services/geminiService');
        return generateJobTitleSuggestions(query, formData.interests);
    };

    if (!isOpen || !user) return null;

    const handleReset = async () => {
        setIsResetting(true);
        try {
            await resetAllData();
            // Navigation happens automatically in resetAllData
            // Don't call onClose() - page will reload
        } catch (e) {
            console.error("[ProfileSettings] Reset failed:", e);
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            alert(`Failed to reset database: ${errorMessage}\n\nPlease try again or contact support.`);
            setIsResetting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="sticky top-0 bg-slate-900/95 backdrop-blur z-10 border-b border-slate-800 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-900/30 rounded-lg text-cyan-400">
                            <User size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-white">Edit Profile</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <User size={12} /> Full Name
                            </label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Linkedin size={12} /> LinkedIn URL
                            </label>
                            <input
                                name="linkedinUrl"
                                value={formData.linkedinUrl || ''}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Briefcase size={12} /> Job Title
                            </label>
                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Building2 size={12} /> Company
                            </label>
                            <input
                                name="company"
                                value={formData.company}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                            />
                        </div>
                    </div>



                    <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Target size={12} /> Target Roles
                        </label>
                        <div className="h-[300px] relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                            {/* Mind Map for Roles */}
                            <MindMapBuilder
                                rootLabel={formData.title}
                                placeholder="Add target role..."
                                initialNodes={formData.targetRoles || []}
                                onNodesChange={handleRoleChange}
                                onGenerateSuggestions={handleJobTitleSuggestions}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <BrainCircuit size={12} /> Interests & Skills
                        </label>
                        <div className="h-[300px] relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                            {/* Mind Map for Interests */}
                            <MindMapBuilder
                                rootLabel="Interests"
                                placeholder="Add interest..."
                                initialNodes={formData.interests || []}
                                onNodesChange={handleInterestChange}
                                onGenerateSuggestions={handleInterestSuggestions}
                            />
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-red-900/10 border border-red-900/30 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
                            <AlertTriangle size={16} /> Danger Zone
                        </h3>
                        <p className="text-slate-400 text-xs mb-3">
                            Reset your entire database and start fresh. This action cannot be undone.
                        </p>

                        {!showResetConfirm ? (
                            <button
                                onClick={() => setShowResetConfirm(true)}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50 font-medium py-2 px-4 rounded-lg transition-all flex items-center gap-2 text-sm"
                            >
                                <Trash2 size={14} /> Reset Database
                            </button>
                        ) : (
                            <div className="space-y-2">
                                <div className="bg-red-950/50 border border-red-500/30 rounded-lg p-3">
                                    <p className="text-red-300 font-medium text-xs mb-1">⚠️ Are you sure?</p>
                                    <p className="text-red-400/80 text-xs">
                                        This will delete all your data: profile, contacts, feed items.
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowResetConfirm(false)}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 rounded-lg transition-all text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        disabled={isResetting}
                                        className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                                    >
                                        {isResetting ? <>Resetting...</> : <><Trash2 size={14} /> Yes, Reset</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-cyan-900/20 flex items-center gap-2"
                    >
                        <Save size={16} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;
