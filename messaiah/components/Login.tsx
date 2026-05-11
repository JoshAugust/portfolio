import React, { useState } from 'react';
import { saveFirebaseConfig } from '../config/firebase';
import { signInWithGoogle, isAuthConfigured } from '../services/authService';
import { Sparkles, ArrowRight, Settings, AlertTriangle, Check, Terminal, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Login: React.FC = () => {
    const [showConfig, setShowConfig] = useState(false); // Default to false
    const [configInput, setConfigInput] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { isDemoMode } = useApp();

    const handleSaveConfig = () => {
        if (saveFirebaseConfig(configInput)) {
            setShowConfig(false);
            setError('');
        } else {
            setError('Invalid JSON configuration. Please check the format.');
        }
    };

    const handleLogin = async () => {
        if (!isAuthConfigured()) {
            setError('System not initialized. Please configure authentication.');
            setShowConfig(true);
            return;
        }

        setIsLoading(true);
        try {
            await signInWithGoogle();
        } catch (e: any) {
            setError(e.message || 'Login failed');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="max-w-md w-full relative z-10">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center gap-3 mb-6">
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-slate-950 font-bold tracking-tighter text-2xl shadow-[0_0_30px_rgba(255,255,255,0.3)] animate-pulse-slow">m</div>
                        <h1 className="font-mono text-4xl font-light tracking-tight text-white">mess.ai.ah</h1>
                    </div>
                    <p className="text-slate-400 text-lg">Your AI Network Savior</p>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">

                    {showConfig ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-2 text-amber-500 mb-2">
                                <Terminal size={18} />
                                <h2 className="font-bold text-sm uppercase tracking-wider">System Configuration</h2>
                            </div>
                            <p className="text-sm text-slate-400 mb-4">
                                Initialize the authentication layer by providing your Firebase project configuration JSON.
                            </p>

                            <textarea
                                value={configInput}
                                onChange={(e) => setConfigInput(e.target.value)}
                                placeholder='{"apiKey": "...", "authDomain": "..."}'
                                className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-300 focus:ring-1 focus:ring-cyan-500 outline-none resize-none"
                            />

                            {error && (
                                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 p-2 rounded">
                                    <AlertTriangle size={12} /> {error}
                                </div>
                            )}

                            <button
                                onClick={handleSaveConfig}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-lg border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2"
                            >
                                <Settings size={16} /> Initialize System
                            </button>

                            <button
                                onClick={() => setShowConfig(false)}
                                className="w-full text-xs text-slate-500 hover:text-white mt-2"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-center mb-4">
                                <div className="px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium flex items-center gap-2">
                                    <Shield size={12} /> Secure Gateway
                                </div>
                            </div>

                            {/* Error Flash for Missing Config */}
                            {error && (
                                <div className="text-center mb-4 animate-pulse">
                                    <p className="text-amber-400 text-xs flex items-center justify-center gap-1">
                                        <AlertTriangle size={10} /> {error}
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={handleLogin}
                                disabled={isLoading}
                                className="w-full group relative overflow-hidden bg-white hover:bg-slate-200 text-slate-900 font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/10"
                            >
                                <div className="relative z-10 flex items-center justify-center gap-3">
                                    {isLoading ? (
                                        <>Connecting...</>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
                                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                            Continue with Google
                                        </>
                                    )}
                                </div>
                            </button>

                            <div className="text-center">
                                {/* Hidden trigger unless config is missing */}
                                <button
                                    onClick={() => setShowConfig(true)}
                                    className="text-xs text-slate-700 hover:text-slate-500 transition-colors flex items-center justify-center gap-1 mx-auto"
                                >
                                    <Settings size={10} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-center text-slate-600 text-xs mt-8">
                    &copy; 2026 mess.ai.ah systems
                </p>
            </div>
        </div>
    );
};

export default Login;
