'use client';

import React from 'react';
import { Settings2, Sun, Contrast, Grid3X3, Palette, LayoutGrid } from 'lucide-react';

interface PatternControlsProps {
    type: 'grayscale' | 'colorchecker' | 'checkerboard';
    setType: (type: 'grayscale' | 'colorchecker' | 'checkerboard') => void;
    brightness: number;
    setBrightness: (val: number) => void;
    contrast: number;
    setContrast: (val: number) => void;
    gamma: number;
    setGamma: (val: number) => void;
    temperature: number;
    setTemperature: (val: number) => void;
}

const PatternControls: React.FC<PatternControlsProps> = ({
    type,
    setType,
    brightness,
    setBrightness,
    contrast,
    setContrast,
    gamma,
    setGamma,
    temperature,
    setTemperature,
}) => {
    return (
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 space-y-8 backdrop-blur-xl">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-zinc-400 font-medium text-sm border-b border-white/5 pb-4">
                    <Grid3X3 className="w-4 h-4" />
                    <span>PATTERN SELECTION</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: 'grayscale', label: 'Grayscale', icon: LayoutGrid },
                        { id: 'colorchecker', label: 'Color Checker', icon: Palette },
                        { id: 'checkerboard', label: 'Distortion', icon: Grid3X3 },
                    ].map((pattern) => (
                        <button
                            key={pattern.id}
                            onClick={() => setType(pattern.id as any)}
                            className={`flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-300 ${type === pattern.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 ring-2 ring-blue-500/50'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                                }`}
                        >
                            <pattern.icon className="w-6 h-6" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{pattern.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-2 text-zinc-400 font-medium text-sm border-b border-white/5 pb-4">
                    <Settings2 className="w-4 h-4" />
                    <span>IMAGE PARAMETERS</span>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2 text-zinc-300">
                                <Sun className="w-4 h-4" />
                                <span>Brightness</span>
                            </div>
                            <span className="font-mono text-blue-400">{brightness}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="200"
                            value={brightness}
                            onChange={(e) => setBrightness(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2 text-zinc-300">
                                <Contrast className="w-4 h-4" />
                                <span>Contrast</span>
                            </div>
                            <span className="font-mono text-blue-400">{contrast}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="200"
                            value={contrast}
                            onChange={(e) => setContrast(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2 text-zinc-300">
                                <span className="font-bold">Gamma</span>
                            </div>
                            <span className="font-mono text-blue-400">{gamma.toFixed(2)}</span>
                        </div>
                        <input
                            type="range"
                            min="1.0"
                            max="3.0"
                            step="0.1"
                            value={gamma}
                            onChange={(e) => setGamma(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2 text-zinc-300">
                                <span className="font-bold">Color Temp</span>
                            </div>
                            <span className="font-mono text-blue-400">{temperature}K</span>
                        </div>
                        <input
                            type="range"
                            min="3000"
                            max="10000"
                            step="100"
                            value={temperature}
                            onChange={(e) => setTemperature(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatternControls;
