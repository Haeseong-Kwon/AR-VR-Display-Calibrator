'use client';

import React, { useState } from 'react';
import CalibrationStepper from '@/components/calibration/CalibrationStepper';
import PatternCanvas from '@/components/calibration/PatternCanvas';
import PatternControls from '@/components/calibration/PatternControls';
import LivePreview from '@/components/calibration/LivePreview';
import AIInsight from '@/components/calibration/AIInsight';
import ProfileHistory from '@/components/calibration/ProfileHistory';
import CalibrationReport from '@/components/reports/CalibrationReport';
import ExportActions from '@/components/calibration/ExportActions';
import { supabase } from '@/lib/supabase';
import { AIRecommendation } from '@/types/calibration';
import { Monitor, Info, ChevronRight, Save, Play, SplitSquareHorizontal, Sparkles, LayoutGrid } from 'lucide-react';

export default function CalibratePage() {
    const [currentStep, setCurrentStep] = useState(2);
    const [patternType, setPatternType] = useState<'grayscale' | 'colorchecker' | 'checkerboard'>('grayscale');
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [gamma, setGamma] = useState(2.2);
    const [temperature, setTemperature] = useState(6500);
    const [viewMode, setViewMode] = useState<'calibrate' | 'preview' | 'history'>('calibrate');
    const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null);

    // Mock AI Analysis
    const runAIAnalysis = () => {
        setAiRecommendation({
            colorTemperature: 6500,
            gamma: 2.2,
            whiteBalance: { r: 1.0, g: 0.98, b: 0.95 },
            deltaE: { before: 8.4, after: 1.2 },
            description: "Corrected significant blue-tint in shadows and optimized gamma curve for OLED response time.",
        });
    };

    // Apply AI Settings
    const applyAIRecommendation = () => {
        if (!aiRecommendation) return;
        setGamma(aiRecommendation.gamma);
        setTemperature(aiRecommendation.colorTemperature);
        setBrightness(95); // Example optimization
        setContrast(110); // Example optimization
    };

    // Supabase Sync (Debounced mock or real)
    React.useEffect(() => {
        const syncParams = async () => {
            // In a real app, we would upsert to 'calibration_sessions' here.
        };
        const timer = setTimeout(syncParams, 500);
        return () => clearTimeout(timer);
    }, [brightness, contrast, gamma, temperature]);

    return (
        <main className="min-h-screen bg-black text-white p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">
                        Display <span className="text-blue-500 underline decoration-blue-500/30">Calibrator</span>
                    </h1>
                    <p className="text-zinc-500 text-sm font-medium">
                        Next-gen AR/VR display correction system • Alpha v1.0
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 flex items-center gap-3">
                        <Monitor className="w-4 h-4 text-blue-500" />
                        <div className="text-left">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Active Device</p>
                            <p className="text-xs font-semibold">Apple Vision Pro (Simulated)</p>
                        </div>
                    </div>
                </div>
            </div>

            <CalibrationStepper currentStep={currentStep} />

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Pattern Generator & Preview */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-4 backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-4 px-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                                    {viewMode === 'calibrate' ? 'Live Pattern' : viewMode === 'preview' ? 'Simulated Preview' : 'Device History'}
                                </span>
                            </div>
                            <div className="flex gap-2 bg-zinc-900 border border-white/5 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('calibrate')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'calibrate' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    Pattern
                                </button>
                                <button
                                    onClick={() => setViewMode('preview')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${viewMode === 'preview' ? 'bg-blue-600/20 text-blue-400' : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    <SplitSquareHorizontal className="w-3 h-3" />
                                    Preview
                                </button>
                                <button
                                    onClick={() => setViewMode('history')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${viewMode === 'history' ? 'bg-zinc-800 text-white shadow-lg shadow-white/5' : 'text-zinc-500 hover:text-zinc-300'
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
                        <div className="flex-1 bg-blue-600/10 border border-blue-500/20 rounded-2xl p-6 flex gap-4 items-start">
                            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-bold text-blue-100 mb-1">Calibration Tip</h3>
                                <p className="text-xs text-blue-100/70 leading-relaxed">
                                    Ensure your ambient lighting is consistent throughout the session. For AR/VR displays, it is recommended to perform measurements in a light-controlled environment.
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
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Controls & Info */}
                <div className="lg:col-span-4 space-y-6">
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

                    {!aiRecommendation ? (
                        <button
                            onClick={runAIAnalysis}
                            className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-purple-500/30 hover:bg-purple-900/10 text-purple-300 rounded-xl py-4 transition-all duration-300 font-bold text-sm"
                        >
                            <Sparkles className="w-4 h-4" />
                            Run AI Analysis
                        </button>
                    ) : (
                        <AIInsight
                            recommendation={aiRecommendation}
                            onApply={applyAIRecommendation}
                        />
                    )}

                    {viewMode !== 'history' && (
                        <ExportActions deviceName="Apple Vision Pro" />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl py-4 transition-all duration-300 font-bold text-sm"
                            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                        >
                            Previous
                        </button>
                        <button
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-4 transition-all duration-300 font-bold text-sm shadow-lg shadow-blue-600/20"
                            onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                        >
                            {currentStep === 4 ? (
                                <>
                                    <Save className="w-4 h-4" />
                                    Finish
                                </>
                            ) : (
                                <>
                                    Next Step
                                    <ChevronRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>

                    <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Device Metadata</span>
                            <Play className="w-3 h-3 text-zinc-500" />
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: 'Panel Type', value: 'Micro-OLED' },
                                { label: 'PPI', value: '3386' },
                                { label: 'Color Space', value: 'DCI-P3 92%' },
                                { label: 'Max Brightness', value: '5000 nits' },
                            ].map((item) => (
                                <div key={item.label} className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-500">{item.label}</span>
                                    <span className="font-semibold text-zinc-200">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
