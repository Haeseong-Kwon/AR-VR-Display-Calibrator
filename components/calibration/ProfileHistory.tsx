'use client';

import React from 'react';
import { Monitor, Calendar, BarChart3, ChevronRight, History, MoreVertical } from 'lucide-react';

interface DeviceProfile {
    id: string;
    name: string;
    type: string;
    lastCalibrated: string;
    avgDeltaE: number;
    status: 'optimal' | 'needs_attention' | 'critical';
}

const mockDevices: DeviceProfile[] = [
    {
        id: '1',
        name: 'Apple Vision Pro',
        type: 'Micro-OLED',
        lastCalibrated: '2026-02-12',
        avgDeltaE: 1.2,
        status: 'optimal'
    },
    {
        id: '2',
        name: 'Meta Quest 3',
        type: 'LCD',
        lastCalibrated: '2026-01-20',
        avgDeltaE: 3.4,
        status: 'needs_attention'
    },
    {
        id: '3',
        name: 'Valve Index',
        type: 'LCD',
        lastCalibrated: '2025-11-15',
        avgDeltaE: 5.8,
        status: 'critical'
    }
];

const ProfileHistory: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                        <History className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white text-[15px]">Profile History</h3>
                        <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Multi-device Management</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockDevices.map((device) => (
                    <div
                        key={device.id}
                        className="bg-zinc-900 border border-white/5 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300 group cursor-pointer"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2.5 bg-zinc-800 rounded-xl group-hover:bg-blue-600/10 group-hover:text-blue-400 transition-colors">
                                <Monitor className="w-5 h-5" />
                            </div>
                            <button className="p-1 text-zinc-600 hover:text-zinc-400 transition-colors">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-1 mb-6">
                            <h4 className="font-bold text-zinc-100 group-hover:text-white transition-colors">{device.name}</h4>
                            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-tighter">{device.type}</p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center bg-zinc-950/40 rounded-lg px-3 py-2 border border-white/5">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="w-3.5 h-3.5 text-zinc-500" />
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Avg ΔE</span>
                                </div>
                                <span className={`text-xs font-mono font-bold ${device.avgDeltaE < 2 ? 'text-green-500' :
                                        device.avgDeltaE < 4 ? 'text-yellow-500' : 'text-red-500'
                                    }`}>
                                    {device.avgDeltaE.toFixed(1)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center bg-zinc-950/40 rounded-lg px-3 py-2 border border-white/5">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Last Run</span>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-zinc-300">{device.lastCalibrated}</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between group/btn text-blue-500 text-[11px] font-bold uppercase tracking-wider">
                            <span>View details</span>
                            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProfileHistory;
