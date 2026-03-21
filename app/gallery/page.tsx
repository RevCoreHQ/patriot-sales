'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { GALLERY_PHOTOS } from '@/data/gallery-photos';
import { cn } from '@/lib/utils';
import type { GalleryCategory } from '@/types';
import { X } from 'lucide-react';

const CAT_LABELS: Record<GalleryCategory, string> = {
  all: 'All Projects',
  'roof-replacement': 'Roof Replacement',
  'roof-repair': 'Roof Repair',
  'gutter': 'Gutters',
  'siding': 'Siding',
  'home-repair': 'Home Repair',
};

const CATEGORIES: GalleryCategory[] = ['all', 'roof-replacement', 'roof-repair', 'gutter', 'siding', 'home-repair'];

export default function GalleryPage() {
  const [filter, setFilter] = useState<GalleryCategory>('all');
  const [lightbox, setLightbox] = useState<string | null>(null);

  const filtered = filter === 'all' ? GALLERY_PHOTOS : GALLERY_PHOTOS.filter(p => p.category === filter);
  const lightboxPhoto = lightbox ? GALLERY_PHOTOS.find(p => p.id === lightbox) : null;

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-c-text">Project Gallery</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Completed projects by Patriot Roofing & Home Repairs</p>
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={cn(
                'h-11 px-5 rounded-xl text-sm font-medium border transition-all cursor-pointer',
                filter === c ? 'border-accent/50 bg-accent/10 text-accent' : 'border-c-border-inner text-neutral-500 hover:text-neutral-300'
              )}
            >
              {CAT_LABELS[c]}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="columns-3 gap-3 space-y-3">
          {filtered.map(photo => (
            <div
              key={photo.id}
              className="break-inside-avoid rounded-xl overflow-hidden cursor-pointer group relative"
              onClick={() => setLightbox(photo.id)}
            >
              <img src={photo.src} alt={photo.alt} className="w-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="text-sm font-semibold text-white">{photo.title}</div>
                  <div className="text-xs text-white/70">{photo.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox */}
        {lightboxPhoto && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8"
            onClick={() => setLightbox(null)}
          >
            <button
              className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
              onClick={() => setLightbox(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
              <img src={lightboxPhoto.src} alt={lightboxPhoto.alt} className="max-h-[80vh] w-auto mx-auto rounded-xl" />
              <div className="text-center mt-3">
                <div className="text-white font-semibold">{lightboxPhoto.title}</div>
                <div className="text-neutral-400 text-sm">{lightboxPhoto.description}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
