'use client';

import React from 'react';
import { Sparkles, TrendingDown, ArrowRight, Zap } from 'lucide-react';
import { AIRecommendation } from '@/types/calibration';

interface AIInsightProps {
    recommendation: AIRecommendation;
    onApply: () => void;
}

const AIInsight: React.FC<AIInsightProps> = ({ recommendation, onApply }) => {
    const improvement = ((recommendation.deltaE.before - recommendation.deltaE.after) / recommendation.deltaE.before) * 100;

    return (
        <div className="relative overflow-hidden bg-zinc-900 border border-purple-500/30 rounded-2xl p-6 shadow-2xl shadow-purple-900/10">
            {/* Background Gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">AI Color Insight</h3>
                            <p className="text-xs text-purple-300 font-medium">Smart Correction Engine</p>
                        </div>
                    </div>
                    <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
                        <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">High Confidence</span>
                    </div>
                </div>

                <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
                    {recommendation.description}
                </p>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-950/50 rounded-xl p-4 border border-white/5">
                        <div className="flex items-center gap-2 mb-2 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                            <TrendingDown className="w-3 h-3" />
                            <span>Delta-E (Error)</span>
                        </div>
                        <div className="flex items-end gap-3">
                            <div>
                                <span className="text-2xl font-bold text-white">{recommendation.deltaE.after.toFixed(2)}</span>
                                <span className="text-xs text-zinc-500 ml-1">target</span>
                            </div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs text-zinc-600 line-through">{recommendation.deltaE.before.toFixed(2)}</span>
                                <span className="text-xs font-bold text-green-500">-{improvement.toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-950/50 rounded-xl p-4 border border-white/5 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500">Color Temp</span>
                            <span className="font-mono text-white">{recommendation.colorTemperature}K</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500">Target Gamma</span>
                            <span className="font-mono text-white">{recommendation.gamma.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500">White Balance</span>
                            <div className="flex gap-1">
                                <span className="w-2 h-2 rounded-full bg-red-500/80" style={{ opacity: recommendation.whiteBalance.r }} />
                                <span className="w-2 h-2 rounded-full bg-green-500/80" style={{ opacity: recommendation.whiteBalance.g }} />
                                <span className="w-2 h-2 rounded-full bg-blue-500/80" style={{ opacity: recommendation.whiteBalance.b }} />
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onApply}
                    className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl py-4 transition-all duration-300 font-bold text-sm shadow-lg shadow-purple-600/20"
                >
                    <Zap className="w-4 h-4 text-purple-200 group-hover:scale-110 transition-transform" />
                    <span>Apply AI Optimized Settings</span>
                    <ArrowRight className="w-4 h-4 ml-1 opacity-70 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default AIInsight;
