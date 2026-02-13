'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Smartphone,
    Settings2,
    Grid2X2,
    ChevronLeft,
    ChevronRight,
    Sun,
    Contrast,
    Wifi,
    RefreshCcw,
    Monitor
} from 'lucide-react';

export default function RemotePage() {
    const [activeTab, setActiveTab] = useState<'pattern' | 'controls'>('pattern');
    const [deviceStatus, setDeviceStatus] = useState<'online' | 'offline'>('offline');
    const [lastCommand, setLastCommand] = useState<string | null>(null);

    // Supabase Realtime Channel
    const channel = supabase.channel('calibration-remote');

    useEffect(() => {
        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                setDeviceStatus('online');
            }
        });

        return () => {
            channel.unsubscribe();
        };
    }, []);

    const sendCommand = async (type: string, payload: any) => {
        setLastCommand(`${type}: ${JSON.stringify(payload)}`);
        await channel.send({
            type: 'broadcast',
            event: 'remote-control',
            payload: { type, ...payload },
        });
    };

    const patterns = [
        { id: 'grayscale', label: 'Grayscale', icon: <Smartphone className="w-5 h-5" /> },
        { id: 'colorchecker', label: 'Color Checker', icon: <Grid2X2 className="w-5 h-5" /> },
        { id: 'checkerboard', label: 'Checkerboard', icon: <Settings2 className="w-5 h-5" /> },
    ];

    return (
        <main className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col items-center p-6 pb-24 font-sans touch-none selection:bg-blue-500/30">
            {/* Header */}
            <div className="w-full max-w-md flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600/10 rounded-xl">
                        <Smartphone className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">Remote <span className="text-blue-500">Sync</span></h1>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Control Node v1.0</p>
                    </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${deviceStatus === 'online' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${deviceStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">{deviceStatus}</span>
                </div>
            </div>

            <div className="w-full max-w-md space-y-8">
                {/* Connection UI */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-active:opacity-30 transition-opacity">
                        <Wifi className="w-12 h-12 text-blue-500" />
                    </div>
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Target Display</p>
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-zinc-800 rounded-2xl shadow-inner border border-white/5">
                            <Monitor className="w-8 h-8 text-zinc-300" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">Apple Vision Pro</h3>
                            <p className="text-xs text-zinc-500">haeseong-vision-sim-01</p>
                        </div>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex p-1 bg-zinc-900/80 rounded-2xl border border-white/5 backdrop-blur-md">
                    <button
                        onClick={() => setActiveTab('pattern')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'pattern' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'
                            }`}
                    >
                        <Grid2X2 className="w-4 h-4" />
                        Patterns
                    </button>
                    <button
                        onClick={() => setActiveTab('controls')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'controls' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'
                            }`}
                    >
                        <Settings2 className="w-4 h-4" />
                        Controls
                    </button>
                </div>

                {/* Dynamic Content */}
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {activeTab === 'pattern' ? (
                        <div className="grid grid-cols-1 gap-3">
                            {patterns.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => sendCommand('SET_PATTERN', { type: p.id })}
                                    className="w-full flex items-center justify-between p-5 bg-zinc-900 border border-white/5 hover:border-blue-500/30 active:scale-[0.98] transition-all rounded-3xl group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-zinc-800 rounded-2xl text-zinc-500 group-hover:text-blue-400 transition-colors">
                                            {p.icon}
                                        </div>
                                        <span className="font-bold text-zinc-200">{p.label}</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-zinc-700" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-zinc-900/80 border border-white/5 rounded-3xl p-6 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                                            <Sun className="w-3.5 h-3.5" />
                                            Brightness
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => sendCommand('ADJUST_BRIGHTNESS', { value: -5 })}
                                            className="flex-1 py-4 bg-zinc-800 rounded-2xl border border-white/5 active:bg-zinc-700 active:scale-[0.96] transition-all"
                                        >
                                            <ChevronLeft className="w-6 h-6 mx-auto" />
                                        </button>
                                        <button
                                            onClick={() => sendCommand('ADJUST_BRIGHTNESS', { value: 5 })}
                                            className="flex-1 py-4 bg-zinc-800 rounded-2xl border border-white/5 active:bg-zinc-700 active:scale-[0.96] transition-all"
                                        >
                                            <ChevronRight className="w-6 h-6 mx-auto" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                                            <Contrast className="w-3.5 h-3.5" />
                                            Contrast
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => sendCommand('ADJUST_CONTRAST', { value: -5 })}
                                            className="flex-1 py-4 bg-zinc-800 rounded-2xl border border-white/5 active:bg-zinc-700 active:scale-[0.96] transition-all"
                                        >
                                            <ChevronLeft className="w-6 h-6 mx-auto" />
                                        </button>
                                        <button
                                            onClick={() => sendCommand('ADJUST_CONTRAST', { value: 5 })}
                                            className="flex-1 py-4 bg-zinc-800 rounded-2xl border border-white/5 active:bg-zinc-700 active:scale-[0.96] transition-all"
                                        >
                                            <ChevronRight className="w-6 h-6 mx-auto" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => sendCommand('RESET', {})}
                                className="w-full py-5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-3xl font-bold flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                            >
                                <RefreshCcw className="w-5 h-5" />
                                Reset Engine
                            </button>
                        </div>
                    )}
                </div>

                {lastCommand && (
                    <div className="pt-8 text-center">
                        <p className="text-[10px] text-zinc-600 font-mono italic">
                            Terminal: {lastCommand}
                        </p>
                    </div>
                )}
            </div>

            {/* Footer / Info */}
            <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black to-transparent pointer-events-none">
                <div className="max-w-md mx-auto bg-zinc-900 border border-white/10 rounded-2xl p-4 pointer-events-auto flex items-center justify-between shadow-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Secure Link Active</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-600">AES-256 Auth</span>
                </div>
            </div>
        </main>
    );
}
