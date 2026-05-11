import React from 'react';
import { Contact, ContactRole } from '../../../types';
import { ChevronDown, ChevronRight, User, Linkedin, Sparkles, BrainCircuit, ExternalLink, Calendar, Lock, AlertTriangle } from 'lucide-react';
import ContextChat from '../../ContextChat';
import DeepDiscoveryButton from './DeepDiscoveryButton';
import { hasApiKey } from '../../../services/geminiService';

interface ContactListProps {
    contacts: Contact[];
    expandedId: string | null;
    toggleExpand: (id: string) => void;
    processingContactId: string | null;
    updateContact: (id: string, updates: Partial<Contact>) => void;
    handleRoleChange: (id: string, newRole: string) => void;
}

const ContactList: React.FC<ContactListProps> = ({
    contacts,
    expandedId,
    toggleExpand,
    processingContactId,
    updateContact,
    handleRoleChange
}) => {

    const getScoreColor = (score: number) => {
        if (score < 30) return 'bg-slate-600';
        if (score < 60) return 'bg-cyan-600';
        return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]';
    };

    return (
        <div className="flex-1 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <div className="overflow-x-auto h-full">
                <table className="w-full text-left border-collapse table-fixed">
                    <thead className="bg-slate-900 text-slate-400 text-xs font-semibold uppercase sticky top-0 z-10 backdrop-blur-md border-b border-slate-800">
                        <tr>
                            <th className="px-3 py-4 w-10"></th>
                            <th className="px-3 py-4 w-1/3">Identity</th>
                            <th className="px-3 py-4 w-28">Role Type</th>
                            <th className="px-3 py-4 w-24">Data</th>
                            <th className="px-3 py-4 w-24">Fit</th>
                            <th className="px-3 py-4 w-auto hidden md:table-cell">Intelligence</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 text-sm">
                        {contacts.map((contact) => (
                            <React.Fragment key={contact.id}>
                                <tr
                                    onClick={() => toggleExpand(contact.id)}
                                    className={`hover:bg-slate-800/40 transition-colors cursor-pointer group ${expandedId === contact.id ? 'bg-slate-800/60' : ''}`}
                                >
                                    <td className="px-3 py-3">
                                        {expandedId === contact.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </td>
                                    <td className="px-3 py-3 overflow-hidden">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border overflow-hidden shrink-0 transition-all duration-500 ${contact.avatarImage ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/20' : 'border-slate-700 bg-slate-800'}`}>
                                                {contact.avatarImage ? (
                                                    <img
                                                        src={contact.avatarImage}
                                                        alt={contact.name}
                                                        className="w-full h-full object-cover animate-in fade-in duration-700"
                                                    />
                                                ) : (
                                                    <User size={16} className="text-slate-500" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium text-white flex items-center gap-2 truncate group-hover:text-cyan-300 transition-colors text-sm">
                                                    {contact.name}
                                                    {contact.linkedinUrl && (
                                                        <a href={contact.linkedinUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-slate-600 hover:text-cyan-400">
                                                            <Linkedin size={12} />
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-slate-400 truncate">
                                                    {contact.role}
                                                </div>
                                                <div className="text-[11px] text-slate-500 truncate">
                                                    {contact.company}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                                            <select
                                                value={contact.type}
                                                onChange={(e) => handleRoleChange(contact.id, e.target.value)}
                                                className={`appearance-none pl-3 pr-2 py-0.5 rounded text-[10px] font-bold border-none outline-none cursor-pointer transition-colors uppercase tracking-wider ${contact.type === ContactRole.SPONSOR ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' :
                                                    contact.type === ContactRole.MENTOR ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20' :
                                                        'bg-slate-800 text-slate-500 hover:bg-slate-700'
                                                    }`}
                                            >
                                                <option value={ContactRole.PEER}>Peer</option>
                                                <option value={ContactRole.MENTOR}>Mentor</option>
                                                <option value={ContactRole.SPONSOR}>Sponsor</option>
                                                <option value={ContactRole.PROSPECT}>Prospect</option>
                                            </select>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-col gap-1 w-20">
                                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${getScoreColor(contact.discoveryScore)}`}
                                                        style={{ width: `${contact.discoveryScore}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <DeepDiscoveryButton
                                                contact={contact}
                                                onUpdate={updateContact}
                                                isEngineProcessing={processingContactId === contact.id}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="flex flex-col gap-1 w-20">
                                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 bg-emerald-500`}
                                                    style={{ width: `${contact.careerFit || 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 hidden md:table-cell">
                                        {contact.intelligence ? (
                                            contact.intelligence.issues?.length ? (
                                                <div className="flex items-center gap-2 text-xs text-amber-400 truncate">
                                                    <AlertTriangle size={10} className="shrink-0" />
                                                    <span className="truncate max-w-[200px]">{contact.intelligence.issues[0]}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-xs text-slate-300 truncate">
                                                    <Sparkles size={10} className="text-cyan-500 shrink-0" />
                                                    <span className="truncate max-w-[200px]">{contact.intelligence.talkingPoints[0] || "Profile Active"}</span>
                                                </div>
                                            )
                                        ) : (
                                            <span className="text-[10px] text-slate-600 italic">...</span>
                                        )}
                                    </td>
                                </tr>

                                {expandedId === contact.id && (
                                    <tr className="bg-slate-900/80 animate-in slide-in-from-top-2 fade-in border-b border-slate-800">
                                        <td colSpan={6} className="px-0 py-0">
                                            <div className="w-full bg-slate-900/50 py-6 border-t border-slate-800">
                                                <div className="max-w-4xl mx-auto px-6">
                                                    <div className="flex flex-col lg:flex-row gap-6">

                                                        {/* Left Column: Intelligence */}
                                                        <div className="flex-1 space-y-4">
                                                            {/* LinkedIn Bio Snippet */}
                                                            {contact.intelligence?.bioSnippet && (
                                                                <div className="space-y-2">
                                                                    <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                                                                        <Linkedin size={12} /> LinkedIn Summary
                                                                    </h4>
                                                                    <div className="bg-sky-950/30 border border-sky-800/50 rounded-xl p-4 text-sm text-slate-300 leading-relaxed italic relative">
                                                                        <span className="absolute top-2 left-2 text-sky-700/50 text-2xl font-serif">"</span>
                                                                        <span className="relative z-10 px-2">{contact.intelligence.bioSnippet}</span>
                                                                        <span className="absolute bottom-0 right-2 text-sky-700/50 text-2xl font-serif">"</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {/* AI Dossier */}
                                                            <div className="space-y-2">
                                                                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                                                                    <BrainCircuit size={12} /> Intelligence Dossier
                                                                </h4>
                                                                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-inner text-sm text-slate-300 leading-relaxed">
                                                                    {contact.intelligence?.summary || contact.notes || "Analysis pending..."}
                                                                </div>
                                                            </div>

                                                            {/* Talking Points */}
                                                            {contact.intelligence?.talkingPoints && contact.intelligence.talkingPoints.length > 0 && (
                                                                <div className="space-y-2">
                                                                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                                                                        <Sparkles size={12} /> Strategic Talking Points
                                                                    </h4>
                                                                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-inner">
                                                                        <ul className="space-y-2">
                                                                            {contact.intelligence.talkingPoints.map((tp, i) => (
                                                                                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                                                                    <span className="text-emerald-500 mt-1.5">•</span>
                                                                                    <span className="leading-relaxed">{tp}</span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Research Issues Log */}
                                                            {contact.intelligence?.issues && contact.intelligence.issues.length > 0 && (
                                                                <div className="space-y-2">
                                                                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                                                                        <AlertTriangle size={12} /> Research Issues
                                                                    </h4>
                                                                    <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4 shadow-inner">
                                                                        <ul className="space-y-1.5">
                                                                            {contact.intelligence.issues.map((issue, i) => (
                                                                                <li key={i} className="text-xs text-amber-200/80 font-mono leading-relaxed">
                                                                                    {issue}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* No intelligence at all */}
                                                            {!contact.intelligence && (
                                                                <div className="space-y-2">
                                                                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                                                                        <Sparkles size={12} /> Strategic Talking Points
                                                                    </h4>
                                                                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-inner">
                                                                        <ul className="space-y-2">
                                                                            <li className="text-slate-500 italic text-xs">Gathering intel...</li>
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Right Column: Actions */}
                                                        <div className="w-full lg:w-[320px] space-y-3 flex flex-col">
                                                            <div className="flex-1 min-h-[220px]">
                                                                <ContextChat
                                                                    contextName={contact.name}
                                                                    data={contact}
                                                                    mode="contact"
                                                                    onUpdate={(updates) => updateContact(contact.id, updates)}
                                                                />
                                                            </div>

                                                            <div className="space-y-2 pt-1">
                                                                <div className="group relative">
                                                                    <button
                                                                        disabled={!hasApiKey()}
                                                                        className="w-full text-left flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors text-xs font-bold shadow-lg shadow-cyan-600/20 disabled:shadow-none"
                                                                    >
                                                                        {hasApiKey() ? <ExternalLink size={14} /> : <Lock size={14} />} Draft Intro Email
                                                                    </button>
                                                                    {!hasApiKey() && (
                                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-slate-900 text-xs text-white rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                                            Add Gemini Key to unlock
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <button className="w-full text-left flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg transition-colors text-xs border border-slate-700">
                                                                    <Calendar size={14} /> Schedule Coffee Chat
                                                                </button>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ContactList;
