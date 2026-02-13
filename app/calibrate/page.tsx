'use client';

import React, { useState, useEffect } from 'react';
import CalibrationStepper from '@/components/calibration/CalibrationStepper';
import PatternCanvas from '@/components/calibration/PatternCanvas';
import PatternControls from '@/components/calibration/PatternControls';
import LivePreview from '@/components/calibration/LivePreview';
import AIInsight from '@/components/calibration/AIInsight';
import ProfileHistory from '@/components/calibration/ProfileHistory';
import CalibrationReport from '@/components/reports/CalibrationReport';
import ExportActions from '@/components/calibration/ExportActions';
import Skeleton from '@/components/ui/Skeleton';
import { supabase } from '@/lib/supabase';
import { AIRecommendation } from '@/types/calibration';
import { Monitor, Info, ChevronRight, Save, Play, SplitSquareHorizontal, Sparkles, LayoutGrid, Smartphone, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function CalibratePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(2);
    const [patternType, setPatternType] = useState<'grayscale' | 'colorchecker' | 'checkerboard'>('grayscale');
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [gamma, setGamma] = useState(2.2);
    const [temperature, setTemperature] = useState(6500);
    const [viewMode, setViewMode] = useState<'calibrate' | 'preview' | 'history'>('calibrate');
    const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null);

    // Simulated Initial Load
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1200);
        return () => clearTimeout(timer);
    }, []);

    // Mock AI Analysis
    const runAIAnalysis = () => {
        setIsLoading(true);
        setTimeout(() => {
            setAiRecommendation({
                colorTemperature: 6500,
                gamma: 2.2,
                whiteBalance: { r: 1.0, g: 0.98, b: 0.95 },
                deltaE: { before: 8.4, after: 1.2 },
                description: "Corrected significant blue-tint in shadows and optimized gamma curve for OLED response time.",
            });
            setIsLoading(false);
        }, 1500);
    };

    // Apply AI Settings
    const applyAIRecommendation = () => {
        if (!aiRecommendation) return;
        setGamma(aiRecommendation.gamma);
        setTemperature(aiRecommendation.colorTemperature);
        setBrightness(95);
        setContrast(110);
    };

    // Remote Control Listener
    useEffect(() => {
        const channel = supabase.channel('calibration-remote');

        channel.on('broadcast', { event: 'remote-control' }, ({ payload }) => {
            if (payload.type === 'SET_PATTERN') {
                setPatternType(payload.type);
                setViewMode('calibrate');
            } else if (payload.type === 'ADJUST_BRIGHTNESS') {
                setBrightness(prev => Math.min(200, Math.max(0, prev + payload.value)));
            } else if (payload.type === 'ADJUST_CONTRAST') {
                setContrast(prev => Math.min(200, Math.max(0, prev + payload.value)));
            } else if (payload.type === 'RESET') {
                setBrightness(100);
                setContrast(100);
                setGamma(2.2);
                setTemperature(6500);
            }
        }).subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, []);

    if (isLoading && viewMode !== 'history') {
        return (
            <main className="min-h-screen bg-black text-white p-8">
                <div className="max-w-7xl mx-auto space-y-12">
                    <div className="flex justify-between items-end">
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-64" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                        <Skeleton className="h-12 w-48" />
                    </div>
                    <Skeleton className="h-32 w-full rounded-3xl" />
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-6">
                            <Skeleton className="h-[500px] w-full rounded-3xl" />
                        </div>
                        <div className="lg:col-span-4 space-y-6">
                            <Skeleton className="h-[400px] w-full rounded-3xl" />
                            <Skeleton className="h-24 w-full rounded-2xl" />
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white p-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
                        Display <span className="text-blue-500 underline decoration-blue-500/30">Calibrator</span>
                        <div className="px-2 py-0.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-[10px] uppercase tracking-widest text-blue-400 font-bold">PRO</div>
                    </h1>
                    <p className="text-zinc-500 text-sm font-medium">
                        Next-gen AR/VR display correction system • Guardion Engine v1.0
                    </p>
                </div>
                <div className="flex gap-4">
                    <Link
                        href="/remote"
                        target="_blank"
                        className="glass-dark rounded-xl px-4 py-2 flex items-center gap-3 hover:border-blue-500/30 transition-all group active:scale-95"
                    >
                        <Smartphone className="w-4 h-4 text-zinc-500 group-hover:text-blue-400" />
                        <div className="text-left">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Remote Control</p>
                            <p className="text-xs font-semibold flex items-center gap-1.5 text-zinc-300">
                                Connect Phone
                                <LinkIcon className="w-2.5 h-2.5 opacity-30" />
                            </p>
                        </div>
                    </Link>
                    <div className="glass-dark rounded-xl px-4 py-2 flex items-center gap-3 border-blue-500/20">
                        <Monitor className="w-4 h-4 text-blue-500" />
                        <div className="text-left">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Active Device</p>
                            <p className="text-xs font-semibold text-zinc-300">Apple Vision Pro (Simulated)</p>
                        </div>
                    </div>
                </div>
            </div>

            <CalibrationStepper currentStep={currentStep} />

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
                {/* Left Column: Pattern Generator & Preview */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="glass rounded-3xl p-4 overflow-hidden relative">
                        <div className="flex justify-between items-center mb-4 px-2 relative z-10">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                                    {viewMode === 'calibrate' ? 'Live Pattern' : viewMode === 'preview' ? 'Simulated Preview' : 'Device History'}
                                </span>
                            </div>
                            <div className="flex gap-2 glass-dark rounded-xl p-1 border-white/5">
                                <button
                                    onClick={() => setViewMode('calibrate')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'calibrate' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    Pattern
                                </button>
                                <button
                                    onClick={() => setViewMode('preview')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${viewMode === 'preview' ? 'bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-500/10' : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    <SplitSquareHorizontal className="w-3 h-3" />
                                    Preview
                                </button>
                                <button
                                    onClick={() => setViewMode('history')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${viewMode === 'history' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    <LayoutGrid className="w-3 h-3" />
                                    History
                                </button>
                            </div>
                        </div>

                        {viewMode === 'calibrate' ? (
                            <PatternCanvas
                                type={patternType}
                                brightness={brightness}
                                contrast={contrast}
                            />
                        ) : viewMode === 'preview' ? (
                            <LivePreview
                                previewParams={{ brightness, contrast, gamma, temperature }}
                            />
                        ) : (
                            <ProfileHistory />
                        )}
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 glass-panel rounded-2xl p-6 flex gap-4 items-start hover:border-blue-500/20 transition-all">
                            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-bold text-blue-100 mb-1">Calibration Tip</h3>
                                <p className="text-xs text-blue-100/70 leading-relaxed font-medium">
                                    Ensure your ambient lighting is consistent throughout the session. For AR/VR displays, it is recommended to perform measurements in a light-controlled environment to minimize lens flare and external interference.
                                </p>
                            </div>
                        </div>
                        {viewMode !== 'history' && (
                            <div className="flex flex-col gap-2">
                                <CalibrationReport
                                    deviceName="Apple Vision Pro"
                                    deltaEBefore={8.4}
                                    deltaEAfter={aiRecommendation?.deltaE.after || 1.2}
                                    gamma={gamma}
                                    temperature={temperature}
                                />
                                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/5 border border-green-500/20 rounded-xl text-[10px] font-bold text-green-500/80">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    VALIDATED BY AI
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Controls & Info */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-dark rounded-3xl p-2 border-white/5">
                        <PatternControls
                            type={patternType}
                            setType={setPatternType}
                            brightness={brightness}
                            setBrightness={setBrightness}
                            contrast={contrast}
                            setContrast={setContrast}
                            gamma={gamma}
                            setGamma={setGamma}
                            temperature={temperature}
                            setTemperature={setTemperature}
                        />
                    </div>

                    {!aiRecommendation ? (
                        <button
                            onClick={runAIAnalysis}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl py-5 transition-all duration-300 font-bold text-sm shadow-[0_0_20px_rgba(37,99,235,0.2)] active:scale-95"
                        >
                            <Sparkles className="w-4 h-4" />
                            Run AI Correction
                        </button>
                    ) : (
                        <div className="animate-in slide-in-from-right-4 duration-500">
                            <AIInsight
                                recommendation={aiRecommendation}
                                onApply={applyAIRecommendation}
                            />
                        </div>
                    )}

                    {viewMode !== 'history' && (
                        <ExportActions deviceName="Apple Vision Pro" />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            className="flex items-center justify-center gap-2 glass-dark hover:bg-zinc-800 text-white rounded-xl py-4 transition-all duration-300 font-bold text-sm hover:border-white/10"
                            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                        >
                            Previous
                        </button>
                        <button
                            className="flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white text-black rounded-xl py-4 transition-all duration-300 font-bold text-sm shadow-lg active:scale-95"
                            onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                        >
                            {currentStep === 4 ? (
                                <>
                                    <Save className="w-4 h-4" />
                                    Finalize
                                </>
                            ) : (
                                <>
                                    Next Step
                                    <ChevronRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>

                    <div className="glass-dark rounded-2xl p-6 border-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Precision Data</span>
                            <Play className="w-3 h-3 text-zinc-600" />
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: 'Panel Type', value: 'Micro-OLED' },
                                { label: 'PPI', value: '3386' },
                                { label: 'Color Space', value: 'DCI-P3 92%' },
                                { label: 'Max Brightness', value: '5000 nits' },
                            ].map((item) => (
                                <div key={item.label} className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-600">{item.label}</span>
                                    <span className="font-bold text-zinc-300">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
