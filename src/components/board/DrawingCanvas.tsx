'use client';

import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import {
    Pencil,
    Square,
    Circle,
    Eraser,
    Type,
    Undo2,
    Trash2,
    Download,
    MousePointer2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawingCanvasProps {
    onSave?: (dataUrl: string) => void;
}

export default function DrawingCanvas({ onSave }: DrawingCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
    const [activeTool, setActiveTool] = useState<string>('pencil');
    const [brushSize, setBrushSize] = useState(5);
    const [color, setColor] = useState('#f97316');

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            isDrawingMode: true,
            width: 600,
            height: 400,
            backgroundColor: 'transparent',
        });

        // Set initial brush
        const brush = new fabric.PencilBrush(canvas);
        brush.color = color;
        brush.width = brushSize;
        canvas.freeDrawingBrush = brush;

        setFabricCanvas(canvas);

        return () => {
            canvas.dispose();
        };
    }, []);

    useEffect(() => {
        if (!fabricCanvas) return;

        if (activeTool === 'pencil') {
            fabricCanvas.isDrawingMode = true;
            const brush = new fabric.PencilBrush(fabricCanvas);
            brush.color = color;
            brush.width = brushSize;
            fabricCanvas.freeDrawingBrush = brush;
        } else {
            fabricCanvas.isDrawingMode = false;
        }
    }, [activeTool, color, brushSize, fabricCanvas]);

    const addRect = () => {
        if (!fabricCanvas) return;
        const rect = new fabric.Rect({
            left: 100,
            top: 100,
            fill: 'transparent',
            width: 100,
            height: 100,
            stroke: color,
            strokeWidth: brushSize,
        });
        fabricCanvas.add(rect);
        setActiveTool('select');
    };

    const addCircle = () => {
        if (!fabricCanvas) return;
        const circle = new fabric.Circle({
            left: 100,
            top: 100,
            radius: 50,
            fill: 'transparent',
            stroke: color,
            strokeWidth: brushSize,
        });
        fabricCanvas.add(circle);
        setActiveTool('select');
    };

    const clearCanvas = () => {
        if (!fabricCanvas) return;
        fabricCanvas.clear();
        fabricCanvas.backgroundColor = 'transparent';
        fabricCanvas.renderAll();
    };

    const downloadDrawing = () => {
        if (!fabricCanvas) return;
        const dataUrl = fabricCanvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 1,
        } as any);
        const link = document.createElement('a');
        link.download = 'sketch.png';
        link.href = dataUrl;
        link.click();
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 glass-panel border-white/5 bg-slate-900/40">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setActiveTool('pencil')}
                        className={cn("icon-box w-8 h-8", activeTool === 'pencil' && "bg-accent-1/20 text-accent-1 border-accent-1/30")}
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        onClick={() => setActiveTool('select')}
                        className={cn("icon-box w-8 h-8", activeTool === 'select' && "bg-accent-1/20 text-accent-1 border-accent-1/30")}
                    >
                        <MousePointer2 size={14} />
                    </button>
                    <div className="w-px h-6 bg-white/5 mx-1" />
                    <button onClick={addRect} className="icon-box w-8 h-8 hover:text-accent-1"><Square size={14} /></button>
                    <button onClick={addCircle} className="icon-box w-8 h-8 hover:text-accent-1"><Circle size={14} /></button>
                    <div className="w-px h-6 bg-white/5 mx-1" />
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-8 h-8 bg-transparent border-none cursor-pointer"
                    />
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={clearCanvas} className="icon-box w-8 h-8 hover:text-red-400"><Trash2 size={14} /></button>
                    <button onClick={downloadDrawing} className="icon-box w-8 h-8 hover:text-accent-3"><Download size={14} /></button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="glass-panel border-white/5 bg-white/5 relative overflow-hidden rounded-xl h-[400px]">
                <canvas ref={canvasRef} />
            </div>

            <div className="flex items-center gap-4 px-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Brush Size</span>
                <input
                    type="range"
                    min="1"
                    max="20"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="flex-1 accent-accent-1"
                />
                <span className="text-xs text-slate-400 w-6">{brushSize}px</span>
            </div>
        </div>
    );
}
