'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { X, RotateCcw, CheckCircle2, PenLine } from 'lucide-react';

interface Props {
  clientName: string;
  total: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

export function SignaturePad({ clientName, total, onSave, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Retina-quality canvas
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#0f0f1a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    setIsDrawing(true);
    setHasSignature(true);
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    e.preventDefault();
    const pos = getPos(e, canvas);
    if (lastPos.current) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    lastPos.current = pos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasSignature(false);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    onSave(canvas.toDataURL('image/png'));
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="w-full max-w-3xl rounded-2xl border border-c-border-inner bg-c-card overflow-hidden shadow-2xl"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Header */}
        <div className="px-6 py-5 flex items-start justify-between border-b border-c-border-inner">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fb8e28]/15 flex items-center justify-center">
              <PenLine className="w-5 h-5 text-[#fb8e28]" />
            </div>
            <div>
              <div className="text-base font-bold text-c-text">Sign & Accept</div>
              <div className="text-xs text-c-text-3 mt-0.5">Authorizes Patriot Roofing & Home Repairs to proceed</div>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center text-c-text-4 hover:bg-c-elevated hover:text-c-text transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quote summary */}
        <div className="px-6 py-4 flex items-center justify-between bg-c-surface border-b border-c-border-inner">
          <div>
            <div className="text-xs text-c-text-4">Client</div>
            <div className="text-sm font-semibold text-c-text mt-0.5">{clientName}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-c-text-4">Total Investment</div>
            <div className="text-xl font-bold text-[#fb8e28] mt-0.5">{total}</div>
          </div>
        </div>

        {/* Signature canvas */}
        <div className="px-6 pt-5 pb-2">
          <div className="text-xs text-c-text-4 mb-2 font-medium">Draw signature below</div>
          <div
            className="relative rounded-xl border border-c-border-inner bg-white overflow-hidden"
            style={{ touchAction: 'none', height: 280 }}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full block cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasSignature && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-gray-300 text-sm italic select-none">Sign here...</span>
              </div>
            )}
            {/* Baseline */}
            <div className="absolute bottom-14 left-6 right-6 border-b border-gray-200" />
            <div className="absolute bottom-6 left-6 text-[10px] text-gray-300 font-medium tracking-widest uppercase select-none">
              Signature
            </div>
          </div>
        </div>

        {/* Legal line */}
        <div className="px-6 pt-3 pb-1">
          <p className="text-[11px] text-c-text-4 leading-relaxed">
            By signing, you authorize Patriot Roofing & Home Repairs to proceed with the described scope of work and agree to
            the terms, payment schedule, and conditions outlined in this estimate.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-5 flex items-center justify-between border-t border-c-border-inner">
          <button
            onClick={clear}
            className="flex items-center gap-2 text-sm text-c-text-4 hover:text-c-text-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
          <div className="flex gap-3">
            <Button variant="ghost" size="md" onClick={onCancel}>Cancel</Button>
            <Button size="md" onClick={save} disabled={!hasSignature} className="gap-2 min-w-[150px]">
              <CheckCircle2 className="w-4 h-4" />
              Sign & Accept
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
