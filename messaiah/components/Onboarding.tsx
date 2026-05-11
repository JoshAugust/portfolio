import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Briefcase, Building2, Linkedin, ArrowRight, Check, Wand2, Sparkles, Upload, Key, HelpCircle, ExternalLink, BrainCircuit } from 'lucide-react';
import { parseCSVData } from '../services/realData';
import { Contact, WeightedNode } from '../types';
import { refreshGenAI, generateInterestSuggestions, generateJobTitleSuggestions } from '../services/geminiService';
import PriorityBoard from './common/PriorityBoard';

const Onboarding: React.FC = () => {
  const { startOnboarding, isLoading } = useApp();
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 4;

  // Form State
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [linkedin, setLinkedin] = useState('');

  // New Mind Map State
  const [interests, setInterests] = useState<WeightedNode[]>([]);
  const [targetRoles, setTargetRoles] = useState<WeightedNode[]>([]);

  // System Setup
  const [apiKey, setApiKey] = useState('');
  const [showKeyInfo, setShowKeyInfo] = useState(false);

  const [uploadedContacts, setUploadedContacts] = useState<Contact[]>([]);
  const [csvError, setCsvError] = useState('');

  const fillPreset = () => {
    // Step 1 Data
    setName('Joshua Augustine');
    setLinkedin('https://www.linkedin.com/in/joshua-augustine-mba/');
    setTitle('MBA Candidate');
    setCompany('CJBS (Cambridge Judge Business School)');
    setIndustry('Management Consulting & AI');

    // Preset Interests for demo
    setInterests([
      { id: 'p1', label: 'Generative AI', priority: 'High', parentId: 'root' },
      { id: 'p2', label: 'Digital Strategy', priority: 'Mid', parentId: 'root' },
      { id: 'p3', label: 'Venture Capital', priority: 'Low', parentId: 'root' }
    ]);

    setTargetRoles([
      { id: 't1', label: 'Chief Product Officer', priority: 'High', parentId: 'root' },
      { id: 't2', label: 'Head of AI Strategy', priority: 'High', parentId: 'root' },
      { id: 't3', label: 'Product Director', priority: 'Mid', parentId: 'root' }
    ]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseCSVData(text);
        if (parsed.length > 0) {
          setUploadedContacts(parsed);
          setCsvError('');
        } else {
          setCsvError('Could not parse any contacts. Check format.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate current step
    if (step === 2 && interests.length === 0) {
      alert("Please add at least one interest.");
      return;
    }
    if (step === 3 && targetRoles.length === 0) {
      // Auto-generate if empty? Or force user?
      // Let's force at least one.
      alert("Please select at least one target role.");
      return;
    }

    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  // Wrapper for Gemini Generators to pass current context
  const handleInterestSuggestions = async (query: string) => {
    return await generateInterestSuggestions(query, { industry });
  };

  const handleJobTitleSuggestions = async (query: string) => {
    // If query is empty/initial, use current title + high priority interests
    if (!query || query === title) {
      return await generateJobTitleSuggestions(title, interests);
    }
    // Otherwise treating query as a refinement
    return await generateJobTitleSuggestions(query, interests);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Onboarding] Submit clicked');
    console.log('[Onboarding] Form data:', { name, title, industry, contactsCount: uploadedContacts.length });

    if (name && title && industry) {
      // Save API Key if provided
      if (apiKey) {
        console.log('[Onboarding] Saving API key');
        localStorage.setItem('GEMINI_API_KEY', apiKey);
        refreshGenAI();
      }

      // Construct derived goal string for compatibility
      const topRoles = targetRoles.filter(r => r.priority === 'High').map(r => r.label).join(' or ');
      const topInterests = interests.filter(i => i.priority === 'High').map(i => i.label).join(', ');
      const goalString = `Transition to ${topRoles || 'a new role'} with a focus on ${topInterests}.`;

      console.log('[Onboarding] Calling startOnboarding...');
      startOnboarding({
        name,
        title,
        company,
        industry,
        linkedinUrl: linkedin,

        // New Data
        interests,
        targetRoles,

        // Legacy/Derived
        goal: goalString,
        topics: interests.map(i => i.label),
        challenge: 'Navigating Career Shift' // Default
      }, uploadedContacts.length > 0 ? uploadedContacts : []); // Allow empty contacts for now
    } else {
      console.error('[Onboarding] Validation failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white space-y-8 animate-fade-in">
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="text-cyan-400 animate-pulse" size={40} />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-cyan-400 animate-pulse font-mono text-sm">INITIALIZING AI AGENTS...</p>
          <p className="text-slate-500 text-xs">Calibrating to your career graph...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans">
      <div className="max-w-[1200px] w-full min-h-[600px] flex bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden">

        {/* Sidebar / Progress */}
        <div className="w-64 bg-slate-950/50 border-r border-slate-800 p-8 flex flex-col justify-between hidden md:flex">
          <div>
            <div className="flex items-center gap-2 mb-8 select-none">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-950 font-bold tracking-tighter shadow-glow">m</div>
              <h1 className="font-mono text-xl text-white tracking-tight">mess.ai.ah</h1>
            </div>

            <div className="space-y-6">
              {[
                { s: 1, label: 'Identity', icon: User },
                { s: 2, label: 'Interests', icon: BrainCircuit },
                { s: 3, label: 'Target Roles', icon: Briefcase },
                { s: 4, label: 'Data Source', icon: Upload }
              ].map((item) => (
                <div key={item.s} className={`flex items-center gap-3 transition-colors duration-300 ${step === item.s ? 'text-cyan-400' : step > item.s ? 'text-emerald-400' : 'text-slate-600'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${step === item.s ? 'border-cyan-400 bg-cyan-950/30' : step > item.s ? 'border-emerald-400 bg-emerald-950/30' : 'border-slate-700 bg-slate-900'}`}>
                    {step > item.s ? <Check size={14} /> : <item.icon size={14} />}
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-600 font-mono">
            Step {step} / {TOTAL_STEPS}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative w-full">
          {/* Preset Button */}
          {step === 1 && (
            <button
              onClick={fillPreset}
              className="absolute top-4 right-4 flex items-center gap-2 text-xs font-medium bg-slate-800/80 hover:bg-cyan-500/20 text-slate-500 hover:text-cyan-300 px-3 py-1.5 rounded-full border border-slate-700 hover:border-cyan-500/30 transition-all z-10"
            >
              <Wand2 size={12} /> Test Preset
            </button>
          )}

          <div className="flex-1 p-8 md:p-12 overflow-y-auto">
            <form onSubmit={step < TOTAL_STEPS ? handleNext : handleSubmit} className="h-full flex flex-col">

              {/* Header for Step */}
              <div className="mb-8">
                <h2 className="text-2xl font-light text-white mb-2">
                  {step === 1 && "Who are you?"}
                  {step === 2 && "Map your interests."}
                  {step === 3 && "Define your trajectory."}
                  {step === 4 && "Initialize System."}
                </h2>
                <p className="text-slate-400">
                  {step === 1 && "Start by verifying your professional identity."}
                  {step === 2 && "Type a core interest to spawn suggestions. Click to prioritize bubbles (High/Mid/Low)."}
                  {step === 3 && "Based on your interests, here are roles you might fit. Explore and select."}
                  {step === 4 && "Upload your LinkedIn data and provide an API Key for the AI."}
                </p>
              </div>

              <div className="flex-1 relative">
                {step === 1 && (
                  <div className="space-y-6 max-w-lg animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                        placeholder="e.g. Jane Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Job Title</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                        placeholder="e.g. Product Manager"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company</label>
                      <input
                        type="text"
                        required
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                        placeholder="e.g. Acme Corp"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Industry</label>
                      <input
                        type="text"
                        required
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                        placeholder="e.g. Fintech"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">LinkedIn URL</label>
                      <input
                        type="url"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                  </div>
                )}



                {step === 2 && (
                  <div className="absolute inset-0 animate-in fade-in duration-700 p-6 md:pb-0">
                    <PriorityBoard
                      rootLabel="Interests"
                      placeholder="Type an interest (e.g. 'AI', 'Music')..."
                      initialNodes={interests}
                      onNodesChange={setInterests}
                      onGenerateSuggestions={handleInterestSuggestions}
                    />
                  </div>
                )}

                {step === 3 && (
                  <div className="absolute inset-0 animate-in fade-in duration-700 p-6 md:pb-0">
                    <PriorityBoard
                      rootLabel={title || "Current Role"}
                      placeholder="Add a target role..."
                      initialNodes={targetRoles}
                      onNodesChange={setTargetRoles}
                      onGenerateSuggestions={handleJobTitleSuggestions}
                    />
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 max-w-lg">
                    {/* API Key Section */}
                    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                          <Key size={20} />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">Google Gemini API Key <span className="text-slate-500 text-xs font-normal ml-2">(Optional)</span></h3>
                          <p className="text-xs text-slate-400 mt-1">Required for AI Strategy & Email Drafting.</p>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none font-mono"
                        placeholder="AIza... (Leave empty for Free Tier)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeyInfo(!showKeyInfo)}
                        className="text-xs text-amber-500 mt-2 flex items-center gap-1 hover:underline"
                      >
                        <HelpCircle size={10} /> Where do I get this?
                      </button>

                      {showKeyInfo && (
                        <div className="mt-2 text-xs text-slate-500 bg-slate-900 p-3 rounded border border-slate-800">
                          Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Google AI Studio</a>. It takes 10 seconds.
                        </div>
                      )}
                    </div>

                    {/* CSV Upload */}
                    <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-cyan-500/30 transition-colors bg-slate-900/30">
                      <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-cyan-400">
                        <Upload size={24} />
                      </div>
                      <h3 className="text-white font-medium mb-1">LinkedIn Connections CSV</h3>
                      <p className="text-xs text-slate-500 mb-4">Export from LinkedIn Settings &gt; Data Privacy</p>

                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label
                        htmlFor="csv-upload"
                        className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-2 rounded-full text-sm font-medium transition-colors border border-slate-700"
                      >
                        Select CSV File
                      </label>

                      {uploadedContacts.length > 0 && (
                        <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm font-bold bg-emerald-950/50 px-4 py-2 rounded-full border border-emerald-500/20">
                          <Check size={14} /> Ready: {uploadedContacts.length} contacts
                        </div>
                      )}
                      {csvError && <p className="mt-2 text-red-500 text-xs">{csvError}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Nav */}
              <div className="mt-8 flex justify-between items-center pt-6 border-t border-slate-800/50">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="text-slate-400 hover:text-white font-medium px-4 py-2 transition-colors"
                  >
                    Back
                  </button>
                ) : <div></div>}

                <button
                  type="submit"
                  className="bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-cyan-900/40 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  {step < TOTAL_STEPS ? (
                    <>Next <ArrowRight size={16} /></>
                  ) : (
                    <>
                      Start Auto-Recon (Free)
                      {!apiKey && <span className="ml-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wide">No Key Req</span>}
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;