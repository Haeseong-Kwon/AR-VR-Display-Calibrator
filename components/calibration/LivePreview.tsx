'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Eye, EyeOff, GripHorizontal, Maximize2 } from 'lucide-react';

interface LivePreviewProps {
    originalImage?: string;
    previewParams: {
        brightness: number;
        contrast: number;
        gamma: number;
        temperature: number;
    };
}

const LivePreview: React.FC<LivePreviewProps> = ({
    originalImage = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop",
    previewParams
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);

    // Handle slider drag
    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        setSliderPosition((x / rect.width) * 100);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchend', handleMouseUp);
        } else {
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchend', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDragging]);

    // Render canvas with effects
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = originalImage;

        img.onload = () => {
            // Set canvas size to match image aspect ratio but fit container
            const containerWidth = containerRef.current?.offsetWidth || 800;
            const aspectRatio = img.width / img.height;
            canvas.width = containerWidth;
            canvas.height = containerWidth / aspectRatio;

            // Draw original image
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Get image data for pixel manipulation
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Calculate split position in pixels
            const splitX = (sliderPosition / 100) * canvas.width;

            // Apply effects only to the right side (Corrected)
            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    if (x < splitX) continue; // Skip left side (Original)

                    const i = (y * canvas.width + x) * 4;

                    let r = data[i];
                    let g = data[i + 1];
                    let b = data[i + 2];

                    // 1. Brightness
                    const brightnessMultiplier = previewParams.brightness / 100;
                    r *= brightnessMultiplier;
                    g *= brightnessMultiplier;
                    b *= brightnessMultiplier;

                    // 2. Contrast
                    const contrastFactor = (259 * (previewParams.contrast + 255)) / (255 * (259 - previewParams.contrast));
                    // Note: simplified contrast formula, better to use standard algorithm
                    // Using a simpler factor for visual approximation:
                    const cMult = (previewParams.contrast / 100) ** 2; // Non-linear response
                    r = (r - 128) * cMult + 128;
                    g = (g - 128) * cMult + 128;
                    b = (b - 128) * cMult + 128;

                    // 3. Gamma
                    const gammaCorrection = 1 / previewParams.gamma;
                    r = 255 * Math.pow(r / 255, gammaCorrection);
                    g = 255 * Math.pow(g / 255, gammaCorrection);
                    b = 255 * Math.pow(b / 255, gammaCorrection);

                    // 4. Color Temperature (Simple tint)
                    // 6500K is neutral for this simple model
                    const tempOffset = (previewParams.temperature - 6500) / 1000;
                    r += tempOffset * 10; // Warm adds red
                    b -= tempOffset * 10; // Cool adds blue

                    // Clamp values
                    data[i] = Math.min(255, Math.max(0, r));
                    data[i + 1] = Math.min(255, Math.max(0, g));
                    data[i + 2] = Math.min(255, Math.max(0, b));
                }
            }

            ctx.putImageData(imageData, 0, 0);

            // Draw split line
            ctx.beginPath();
            ctx.moveTo(splitX, 0);
            ctx.lineTo(splitX, canvas.height);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        };
    }, [originalImage, previewParams, sliderPosition]);

    return (
        <div
            ref={containerRef}
            className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-zinc-900 border border-white/10 group select-none"
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
        >
            <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Before</span>
            </div>
            <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-blue-600/80 backdrop-blur-md rounded-full border border-blue-500/30 flex items-center gap-2">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">After (AI Corrected)</span>
            </div>

            <canvas
                ref={canvasRef}
                className="w-full h-auto block"
            />

            {/* Slider Handle */}
            <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-30 hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-shadow"
                style={{ left: `${sliderPosition}%` }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center text-zinc-900">
                    <GripHorizontal className="w-5 h-5" />
                </div>
            </div>

            <div className="absolute bottom-4 right-4 z-20">
                <button className="p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors">
                    <Maximize2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default LivePreview;
