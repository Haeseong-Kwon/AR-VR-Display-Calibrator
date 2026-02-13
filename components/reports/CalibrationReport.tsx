'use client';

import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FileText, Download, ShieldCheck, Activity } from 'lucide-react';

interface CalibrationReportProps {
    deviceName: string;
    deltaEBefore: number;
    deltaEAfter: number;
    gamma: number;
    temperature: number;
}

const CalibrationReport: React.FC<CalibrationReportProps> = ({
    deviceName,
    deltaEBefore,
    deltaEAfter,
    gamma,
    temperature,
}) => {
    const reportRef = useRef<HTMLDivElement>(null);

    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const generatePDF = async () => {
        if (!reportRef.current) return;

        const canvas = await html2canvas(reportRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#000000',
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Calibration_Report_${deviceName.replace(/\s+/g, '_')}.pdf`);
    };

    return (
        <div className="space-y-6">
            {/* Hidden Report Template for PDF Generation */}
            <div className="hidden">
                <div
                    ref={reportRef}
                    className="w-[210mm] p-[20mm] bg-black text-white font-sans"
                >
                    <div className="border-b border-zinc-800 pb-8 mb-12 flex justify-between items-end">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">Calibration Report</h1>
                            <p className="text-zinc-500 text-sm">Professional Display Profiling System</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Session ID</p>
                            <p className="text-xl font-mono text-blue-500">CAL-882-X90</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mb-12">
                        <div className="space-y-6">
                            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">Device Information</h2>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 text-sm">Display Model</span>
                                    <span className="font-bold">{deviceName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 text-sm">Target Gamma</span>
                                    <span className="font-mono">{gamma.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 text-sm">Target Temp</span>
                                    <span className="font-mono">{temperature}K</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">Accuracy Summary</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Before ΔE</p>
                                    <p className="text-2xl font-mono text-red-500">{deltaEBefore.toFixed(2)}</p>
                                </div>
                                <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">After ΔE</p>
                                    <p className="text-2xl font-mono text-green-500">{deltaEAfter.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8 mb-12">
                        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">Measurement Charts</h2>
                        <div className="grid grid-cols-2 gap-8 h-64">
                            <div className="bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800">
                                <span className="text-zinc-600 text-[10px] font-bold uppercase">CIE Chromaticity Diagram</span>
                            </div>
                            <div className="bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800">
                                <span className="text-zinc-600 text-[10px] font-bold uppercase">Gamma Response Curve</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-zinc-800 text-[10px] text-zinc-600 flex justify-between italic">
                        <span>Generated on {isMounted ? new Date().toLocaleDateString() : '--'}</span>
                        <span>Ref: Precision Display Calibrator Engine v1.0</span>
                    </div>
                </div>
            </div>

            <button
                onClick={generatePDF}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/10 hover:border-white/20 rounded-xl text-xs font-bold text-zinc-300 transition-all active:scale-95"
            >
                <FileText className="w-4 h-4 text-blue-500" />
                <span>Export PDF Report</span>
            </button>
        </div>
    );
};

export default CalibrationReport;
