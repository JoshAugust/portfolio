import React, { useState, useEffect } from 'react';
import { Key, Check, AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { refreshGenAI, hasApiKey as hasGeminiKey, testApiKey as testGeminiKey } from '../../services/geminiService';
import { hasApifyKey, testApifyKey, setApifyKey as saveApifyKey } from '../../services/apifyService';

const ApiKeyInput: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Gemini State
    const [geminiKey, setGeminiKey] = useState('');
    const [isGeminiValid, setIsGeminiValid] = useState(false);
    const [showGeminiKey, setShowGeminiKey] = useState(false);
    const [isCheckingGemini, setIsCheckingGemini] = useState(false);
    
    // Apify State
    const [apifyKey, setApifyKey] = useState('');
    const [isApifyValid, setIsApifyValid] = useState(false);
    const [showApifyKey, setShowApifyKey] = useState(false);
    const [isCheckingApify, setIsCheckingApify] = useState(false);
    
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Check initial state
        const storedGemini = localStorage.getItem('GEMINI_API_KEY');
        if (storedGemini) {
            setGeminiKey(storedGemini);
            setIsGeminiValid(hasGeminiKey());
        }

        const storedApify = localStorage.getItem('APIFY_API_KEY');
        if (storedApify) {
            setApifyKey(storedApify);
            setIsApifyValid(hasApifyKey());
        }
    }, []);

    const handleSaveGemini = async () => {
        setIsCheckingGemini(true);
        setErrorMessage('');
        localStorage.setItem('GEMINI_API_KEY', geminiKey);

        const hasKey = refreshGenAI();
        if (!hasKey) {
            setErrorMessage('Invalid Gemini API key format');
            setIsGeminiValid(false);
            setIsCheckingGemini(false);
            return;
        }

        const isValid = await testGeminiKey();
        setIsGeminiValid(isValid);
        setIsCheckingGemini(false);

        if (!isValid) {
            setErrorMessage('Gemini API key validation failed. Please check your key.');
        }
    };

    const handleSaveApify = async () => {
        setIsCheckingApify(true);
        setErrorMessage('');
        saveApifyKey(apifyKey);

        const isValid = await testApifyKey();
        setIsApifyValid(isValid);
        setIsCheckingApify(false);

        if (!isValid) {
            setErrorMessage('Apify API key validation failed. Please check your key.');
        }
    };

    const handleClear = () => {
        localStorage.removeItem('GEMINI_API_KEY');
        localStorage.removeItem('APIFY_API_KEY');
        setGeminiKey('');
        setApifyKey('');
        setIsGeminiValid(false);
        setIsApifyValid(false);
        refreshGenAI();
    };

    const isAllValid = isGeminiValid && isApifyValid;
    const hasAnyKeys = !!geminiKey || !!apifyKey;

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${isAllValid
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20 animate-pulse'
                    }`}
            >
                {isAllValid ? <Check size={12} /> : <AlertTriangle size={12} />}
                {isAllValid ? 'Systems Active' : 'API Keys Required'}
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-cyan-500"></div>

                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Key className="text-amber-400" size={20} /> Configure Neural Link
                    </h3>
                    <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                        ✕
                    </button>
                </div>

                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    Provide your API Keys to enable real analysis and LinkedIn scraping.
                    They are stored locally in your browser.
                </p>

                <div className="space-y-6">
                    {/* Gemini Key Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gemini API Key (AI Analysis)</label>
                        <div className="relative">
                            <input
                                type={showGeminiKey ? "text" : "password"}
                                value={geminiKey}
                                onChange={(e) => setGeminiKey(e.target.value)}
                                placeholder="Paste Gemini Key..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none pr-10 font-mono text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowGeminiKey(!showGeminiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                            >
                                {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <button
                            onClick={handleSaveGemini}
                            disabled={!geminiKey || isCheckingGemini}
                            className={`w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${isGeminiValid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                        >
                            {isCheckingGemini ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            {isCheckingGemini ? 'Validating...' : (isGeminiValid ? 'Gemini Connected' : 'Connect Gemini')}
                        </button>
                    </div>

                    {/* Apify Key Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Apify API Key (LinkedIn Scraping)</label>
                        <div className="relative">
                            <input
                                type={showApifyKey ? "text" : "password"}
                                value={apifyKey}
                                onChange={(e) => setApifyKey(e.target.value)}
                                placeholder="Paste Apify Key..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none pr-10 font-mono text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowApifyKey(!showApifyKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                            >
                                {showApifyKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <button
                            onClick={handleSaveApify}
                            disabled={!apifyKey || isCheckingApify}
                            className={`w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${isApifyValid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                        >
                            {isCheckingApify ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            {isCheckingApify ? 'Validating...' : (isApifyValid ? 'Apify Connected' : 'Connect Apify')}
                        </button>
                    </div>

                    {errorMessage && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                            <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-red-400 text-xs">{errorMessage}</p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-slate-800">
                        <button
                            onClick={handleClear}
                            className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
                        >
                            Clear All
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="flex-1 bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-slate-900 font-bold py-2 rounded-lg shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyInput;
