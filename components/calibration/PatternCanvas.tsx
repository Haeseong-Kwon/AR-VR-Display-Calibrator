'use client';

import React, { useRef, useEffect } from 'react';

interface PatternCanvasProps {
    type: 'grayscale' | 'colorchecker' | 'checkerboard';
    brightness: number;
    contrast: number;
}

const PatternCanvas: React.FC<PatternCanvasProps> = ({ type, brightness, contrast }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);

        // Apply brightness and contrast filters
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

        switch (type) {
            case 'grayscale':
                drawGrayscale(ctx, width, height);
                break;
            case 'colorchecker':
                drawColorChecker(ctx, width, height);
                break;
            case 'checkerboard':
                drawCheckerboard(ctx, width, height);
                break;
        }
    }, [type, brightness, contrast]);

    const drawGrayscale = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const steps = 256;
        const stepWidth = width / steps;
        for (let i = 0; i < steps; i++) {
            const gray = i;
            ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
            ctx.fillRect(i * stepWidth, 0, stepWidth, height);
        }
    };

    const drawColorChecker = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const colors = [
            '#735244', '#c29682', '#627a9d', '#576c43', '#8580b1', '#67bdaa',
            '#d67e2c', '#505ba6', '#c15a63', '#5e3c6c', '#9dbc40', '#e0a32e',
            '#383d96', '#469449', '#af363c', '#e7c71f', '#bb5695', '#0885a1',
            '#f3f3f2', '#c7c8c8', '#a0a0a0', '#7a7a79', '#555555', '#343434'
        ];
        const cols = 6;
        const rows = 4;
        const cellWidth = width / cols;
        const cellHeight = height / rows;

        colors.forEach((color, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            ctx.fillStyle = color;
            ctx.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
        });
    };

    const drawCheckerboard = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const size = 40;
        const cols = Math.ceil(width / size);
        const rows = Math.ceil(height / size);

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                ctx.fillStyle = (i + j) % 2 === 0 ? '#FFFFFF' : '#000000';
                ctx.fillRect(j * size, i * size, size, size);
            }
        }
    };

    return (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-white/10">
            <canvas
                ref={canvasRef}
                width={1920}
                height={1080}
                className="w-full h-full object-contain"
            />
        </div>
    );
};

export default PatternCanvas;
