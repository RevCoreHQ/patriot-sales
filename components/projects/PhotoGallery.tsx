'use client';

import { useRef, useState } from 'react';
import { useProjectsStore } from '@/store/projects';
import { compressImage } from '@/lib/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProjectPhoto } from '@/types';

const PHASE_TABS: { value: ProjectPhoto['phase'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'before', label: 'Before' },
  { value: 'during', label: 'During' },
  { value: 'after', label: 'After' },
];

export function PhotoGallery({ projectId }: { projectId: string }) {
  const { projects, addPhoto, removePhoto } = useProjectsStore();
  const project = projects.find(p => p.id === projectId);
  const photos = project?.photos ?? [];

  const [phaseFilter, setPhaseFilter] = useState<ProjectPhoto['phase'] | 'all'>('all');
  const [addPhase, setAddPhase] = useState<ProjectPhoto['phase']>('during');
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = phaseFilter === 'all' ? photos : photos.filter(p => p.phase === phaseFilter);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await compressImage(file);
      addPhoto(projectId, { phase: addPhase, dataUrl });
    } catch (err) {
      alert('Failed to process photo. Please try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = (photoId: string) => {
    if (confirm('Delete this photo?')) removePhoto(projectId, photoId);
  };

  const lightboxPhoto = lightboxIdx !== null ? filtered[lightboxIdx] : null;

  return (
    <div>
      {/* Phase filter + add button */}
      <div className="flex items-center gap-2 mb-4">
        {PHASE_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setPhaseFilter(t.value)}
            className={`h-10 px-3 text-xs font-semibold rounded-xl transition-all ${
              phaseFilter === t.value
                ? 'bg-[#fb8e28]/12 text-[#fb8e28] border border-[#fb8e28]/25'
                : 'bg-c-card text-c-text-4 border border-c-border active:bg-c-surface'
            }`}
          >
            {t.label}
            {t.value !== 'all' && (
              <span className="ml-1 text-[10px]">
                ({photos.filter(p => t.value === 'all' || p.phase === t.value).length})
              </span>
            )}
          </button>
        ))}
        <div className="flex-1" />
        {/* Phase selector for new photo */}
        <select
          value={addPhase}
          onChange={e => setAddPhase(e.target.value as ProjectPhoto['phase'])}
          className="h-10 bg-c-surface border border-c-border-inner rounded-xl px-2 text-xs text-c-text-3 focus:outline-none"
        >
          <option value="before">Before</option>
          <option value="during">During</option>
          <option value="after">After</option>
        </select>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 h-10 px-4 bg-[#fb8e28] text-black text-xs font-bold rounded-xl active:bg-[#fb8e28] active:scale-[0.97] transition-all disabled:opacity-50"
        >
          <Camera className="w-3.5 h-3.5" />
          {uploading ? 'Processing...' : 'Add Photo'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCapture}
          className="hidden"
        />
      </div>

      {/* Photo grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-c-text-4 text-sm">
          No photos yet. Tap &ldquo;Add Photo&rdquo; to capture.
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {filtered.map((photo, idx) => (
            <button
              key={photo.id}
              onClick={() => setLightboxIdx(idx)}
              className="relative aspect-square rounded-xl overflow-hidden group border border-c-border-inner"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.dataUrl} alt={photo.caption || photo.phase} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-active:bg-black/30 transition-all" />
              <span className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/60 text-white/80">
                {photo.phase}
              </span>
              <button
                onClick={e => { e.stopPropagation(); handleDelete(photo.id); }}
                className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-black/60 text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxPhoto && lightboxIdx !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxIdx(null)}
          >
            <button
              onClick={e => { e.stopPropagation(); setLightboxIdx(null); }}
              className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-white/10 rounded-2xl text-white active:bg-white/20 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            {lightboxIdx > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 rounded-2xl text-white active:bg-white/20 transition-colors z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {lightboxIdx < filtered.length - 1 && (
              <button
                onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 rounded-2xl text-white active:bg-white/20 transition-colors z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            <motion.div
              key={lightboxPhoto.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="max-w-[85vw] max-h-[85vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxPhoto.dataUrl}
                alt={lightboxPhoto.caption || lightboxPhoto.phase}
                className="max-w-full max-h-[85vh] rounded-2xl object-contain"
              />
              <div className="flex items-center justify-between mt-3 px-2">
                <span className="text-xs text-white/50 uppercase font-bold">{lightboxPhoto.phase}</span>
                <span className="text-xs text-white/40">{new Date(lightboxPhoto.timestamp).toLocaleDateString()}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
