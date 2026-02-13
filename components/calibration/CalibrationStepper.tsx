'use client';

import React from 'react';
import { Check, Monitor, Layout, Sliders, Database } from 'lucide-react';

const steps = [
    { id: 1, name: 'Device Setup', icon: Monitor },
    { id: 2, name: 'Pattern Generation', icon: Layout },
    { id: 3, name: 'Measurement', icon: Sliders },
    { id: 4, name: 'Save Results', icon: Database },
];

interface CalibrationStepperProps {
    currentStep: number;
}

const CalibrationStepper: React.FC<CalibrationStepperProps> = ({ currentStep }) => {
    return (
        <div className="flex items-center justify-between w-full max-w-4xl mx-auto mb-12 relative px-4">
            {/* Background Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-zinc-800 -translate-y-1/2 z-0" />

            {/* Progress Line */}
            <div
                className="absolute top-1/2 left-0 h-0.5 bg-blue-500 -translate-y-1/2 z-0 transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((step) => {
                const isCompleted = step.id < currentStep;
                const isActive = step.id === currentStep;

                return (
                    <div key={step.id} className="relative z-10 flex flex-col items-center">
                        <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl ${isCompleted
                                    ? 'bg-blue-500 text-white'
                                    : isActive
                                        ? 'bg-zinc-100 text-zinc-900 scale-110 ring-4 ring-blue-500/30'
                                        : 'bg-zinc-900 border-2 border-zinc-800 text-zinc-500'
                                }`}
                        >
                            {isCompleted ? (
                                <Check className="w-6 h-6" />
                            ) : (
                                <step.icon className="w-6 h-6" />
                            )}
                        </div>
                        <div className="absolute -bottom-8 whitespace-nowrap">
                            <span
                                className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${isActive ? 'text-white' : 'text-zinc-500'
                                    }`}
                            >
                                {step.name}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CalibrationStepper;
