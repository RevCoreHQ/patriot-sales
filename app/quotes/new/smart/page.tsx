'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { useQuotesStore } from '@/store/quotes';
import { useSettingsStore } from '@/store/settings';
import { ADDONS } from '@/data/addons';
import { PROJECT_TYPES } from '@/data/project-types';
import { buildLineItems } from '@/lib/pricing';
import { formatCurrency, generateId } from '@/lib/utils';
import type { AddonSelection, LineItem, ProjectTypeId } from '@/types';
import {
  ArrowLeft, ArrowRight, Check, Plus, Minus, Trash2, Receipt,
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────
const STEPS = ['Client', 'Project', 'Line Items', 'Extras', 'Review'] as const;
type Step = 0 | 1 | 2 | 3 | 4;

const LINE_ITEM_CATEGORIES: { value: LineItem['category']; label: string; color: string }[] = [
  { value: 'material', label: 'Material',  color: 'text-blue-400' },
  { value: 'labor',    label: 'Labor',     color: 'text-emerald-400' },
  { value: 'addon',    label: 'Add-on',    color: 'text-purple-400' },
  { value: 'misc',     label: 'Misc',      color: 'text-c-text-3' },
];
const COMMON_UNITS = ['sq ft', 'linear ft', 'each', 'flat', 'hr', 'ton'];

const ADDON_CATEGORIES: { id: string; label: string; emoji: string }[] = [
  { id: 'structures', label: 'Structures',  emoji: '🏡' },
  { id: 'fire',       label: 'Fire',        emoji: '🔥' },
  { id: 'lighting',   label: 'Lighting',    emoji: '💡' },
  { id: 'water',      label: 'Water',       emoji: '💧' },
  { id: 'drainage',   label: 'Drainage',    emoji: '🔩' },
  { id: 'planting',   label: 'Planting',    emoji: '🌳' },
  { id: 'finishing',  label: 'Finishing',   emoji: '✨' },
];

// ─── Live estimate helper ─────────────────────────────────────────────────────
function computeLiveTotal(
  lineItems: LineItem[],
  addonSelections: AddonSelection[],
  sqFt: number,
  demo: boolean,
  settings: { pricing: { taxRate: number; demolitionRate: number; addonPrices: Record<string, number> } }
): number {
  const addonItems = buildLineItems(
    [], addonSelections,
    { squareFootage: sqFt, shape: 'rectangle', slope: 'flat', access: 'easy', demo },
    settings.pricing.demolitionRate ?? 2.5,
    {},
    settings.pricing.addonPrices ?? {}
  );
  const subtotal = lineItems.reduce((s, i) => s + i.total, 0) + addonItems.reduce((s, i) => s + i.total, 0);
  return subtotal * (1 + settings.pricing.taxRate / 100);
}

// ─── Small reusable components ────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-c-text-3 uppercase tracking-wider mb-2 block">{children}</label>;
}

function TextInput({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-c-input border border-c-border-input rounded-xl px-4 py-3 text-sm text-c-text placeholder:text-c-text-4 focus:outline-none focus:border-amber-500/50 transition-colors"
      />
    </div>
  );
}

// ─── Step 1: Client ───────────────────────────────────────────────────────────
function StepClient({ client, onChange }: {
  client: Record<string, string>;
  onChange: (k: string, v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-c-text">Who&apos;s the client?</h2>
        <p className="text-c-text-3 text-sm mt-1">Basic contact info for the estimate header.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <TextInput label="Full Name *" value={client.name ?? ''} onChange={v => onChange('name', v)} placeholder="e.g. Michael & Sarah Thompson" />
        </div>
        <TextInput label="Phone *" value={client.phone ?? ''} onChange={v => onChange('phone', v)} placeholder="(303) 555-0100" type="tel" />
        <TextInput label="Email" value={client.email ?? ''} onChange={v => onChange('email', v)} placeholder="client@email.com" type="email" />
        <div className="col-span-2">
          <TextInput label="Project Address" value={client.address ?? ''} onChange={v => onChange('address', v)} placeholder="123 Main St, Boulder, CO 80301" />
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Project type + scope ─────────────────────────────────────────────
function StepProject({
  projectTypes, sqFt, demo,
  onToggleType, onSqFt, onDemo,
}: {
  projectTypes: ProjectTypeId[];
  sqFt: number;
  demo: boolean;
  onToggleType: (id: ProjectTypeId) => void;
  onSqFt: (v: number) => void;
  onDemo: (v: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-c-text">What are we building?</h2>
        <p className="text-c-text-3 text-sm mt-1">Select all project types that apply.</p>
      </div>

      {/* Project type grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {PROJECT_TYPES.map(pt => {
          const active = projectTypes.includes(pt.id);
          return (
            <button key={pt.id} onClick={() => onToggleType(pt.id)}
              className={`relative flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                active ? 'border-amber-500/50 bg-amber-500/8 text-c-text' : 'border-c-border bg-c-elevated text-c-text-3 hover:border-c-border-hover hover:text-c-text-2'
              }`}
            >
              <span className="text-xl leading-none mt-0.5">{pt.icon}</span>
              <div>
                <div className="text-sm font-semibold">{pt.label}</div>
                <div className="text-[11px] opacity-60 mt-0.5">{pt.description}</div>
              </div>
              {active && (
                <div className="absolute top-2.5 right-2.5 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-black" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Square footage */}
      <div>
        <FieldLabel>Total square footage</FieldLabel>
        <div className="flex items-center gap-3">
          <button onClick={() => onSqFt(Math.max(50, sqFt - 50))} className="w-10 h-10 rounded-xl bg-c-elevated text-c-text flex items-center justify-center hover:bg-c-tag transition-all shrink-0">
            <Minus className="w-4 h-4" />
          </button>
          <div className="flex-1 relative">
            <input type="number" value={sqFt} min={50} step={50}
              onChange={e => onSqFt(Math.max(50, Number(e.target.value)))}
              className="w-full bg-c-input border border-c-border-input rounded-xl px-4 py-3 text-lg font-bold text-c-text text-center focus:outline-none focus:border-amber-500/50 transition-colors" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-c-text-4 text-sm">sq ft</span>
          </div>
          <button onClick={() => onSqFt(sqFt + 50)} className="w-10 h-10 rounded-xl bg-c-elevated text-c-text flex items-center justify-center hover:bg-c-tag transition-all shrink-0">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Demo toggle */}
      <div>
        <FieldLabel>Demolition / Removal</FieldLabel>
        <div className="flex gap-3">
          {[false, true].map(val => (
            <button key={String(val)} onClick={() => onDemo(val)}
              className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                demo === val
                  ? val ? 'border-amber-500/50 bg-amber-500/10 text-amber-300' : 'border-c-border-hover bg-c-elevated text-c-text'
                  : 'border-c-border text-c-text-3 hover:border-c-border-hover'
              }`}
            >
              {val ? '⚒ Yes — demo existing surface' : '✓ No demo needed'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Line Items ────────────────────────────────────────────────────────
const EMPTY_LI_FORM = { description: '', category: 'material' as LineItem['category'], quantity: 1, unit: 'sq ft', unitPrice: 0 };

function StepLineItems({
  lineItems, onAdd, onRemove,
}: {
  lineItems: LineItem[];
  onAdd: (item: LineItem) => void;
  onRemove: (id: string) => void;
}) {
  const [form, setForm] = useState(EMPTY_LI_FORM);
  const [showForm, setShowForm] = useState(lineItems.length === 0);
  const previewTotal = form.quantity * form.unitPrice;

  const handleAdd = () => {
    if (!form.description.trim() || form.unitPrice <= 0) return;
    onAdd({ id: generateId(), description: form.description.trim(), category: form.category, quantity: form.quantity, unit: form.unit, unitPrice: form.unitPrice, total: form.quantity * form.unitPrice });
    setForm(EMPTY_LI_FORM);
    setShowForm(false);
  };

  const catColor = (cat: LineItem['category']) => LINE_ITEM_CATEGORIES.find(c => c.value === cat)?.color ?? 'text-c-text-3';
  const grandTotal = lineItems.reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-c-text">Line Items</h2>
        <p className="text-c-text-3 text-sm mt-1">Add each cost item — materials, labor, and anything else.</p>
      </div>

      {lineItems.length > 0 && (
        <div className="bg-c-card border border-c-border-inner rounded-xl overflow-hidden">
          <div className="divide-y divide-c-border-inner">
            {lineItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-c-text truncate">{item.description}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs capitalize ${catColor(item.category)}`}>{item.category}</span>
                    {item.unit !== 'flat' && <span className="text-xs text-c-text-4">{item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}</span>}
                  </div>
                </div>
                <div className="text-sm font-semibold text-c-text shrink-0">{formatCurrency(item.total)}</div>
                <button onClick={() => onRemove(item.id)} className="p-1 text-c-text-4 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-c-border-inner flex justify-between bg-c-surface">
            <span className="text-xs font-medium text-c-text-3 uppercase tracking-wider">Subtotal</span>
            <span className="text-base font-bold text-c-text">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      )}

      {lineItems.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-12 bg-c-card border border-c-border-inner rounded-xl">
          <Receipt className="w-8 h-8 text-c-text-4 mb-3" />
          <div className="text-sm text-c-text-3">No line items yet</div>
        </div>
      )}

      {showForm && (
        <div className="bg-c-card border border-c-border-inner rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-c-text-3 uppercase tracking-wider">New Line Item</div>
          <div>
            <FieldLabel>Description</FieldLabel>
            <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="e.g. Belgard Cambridge Cobble — Main Patio"
              className="w-full bg-c-input border border-c-border-input rounded-xl px-4 py-3 text-sm text-c-text placeholder:text-c-text-4 focus:outline-none focus:border-amber-500/50"
              onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          </div>
          <div>
            <FieldLabel>Category</FieldLabel>
            <div className="flex gap-2 flex-wrap">
              {LINE_ITEM_CATEGORIES.map(cat => (
                <button key={cat.value} type="button" onClick={() => setForm(p => ({ ...p, category: cat.value }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.category === cat.value ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' : 'border-c-border-inner text-c-text-3 hover:border-c-border-hover'}`}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <FieldLabel>Qty</FieldLabel>
              <input type="number" min="0" step="1" value={form.quantity}
                onChange={e => setForm(p => ({ ...p, quantity: Number(e.target.value) || 1 }))}
                className="w-full bg-c-input border border-c-border-input rounded-xl px-4 py-3 text-sm text-c-text focus:outline-none focus:border-amber-500/50" />
            </div>
            <div>
              <FieldLabel>Unit</FieldLabel>
              <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                className="w-full bg-c-input border border-c-border-input rounded-xl px-4 py-3 text-sm text-c-text focus:outline-none focus:border-amber-500/50">
                {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Unit Price</FieldLabel>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-c-text-3 text-sm">$</span>
                <input type="number" min="0" step="0.01" value={form.unitPrice || ''}
                  onChange={e => setForm(p => ({ ...p, unitPrice: Number(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="w-full bg-c-input border border-c-border-input rounded-xl pl-8 pr-4 py-3 text-sm text-c-text placeholder:text-c-text-4 focus:outline-none focus:border-amber-500/50" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="text-sm text-c-text-3">Total: <span className="font-bold text-c-text">{formatCurrency(previewTotal)}</span></div>
            <div className="flex gap-2">
              {lineItems.length > 0 && (
                <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_LI_FORM); }}
                  className="px-4 py-2 bg-c-elevated text-c-text-3 text-sm rounded-xl hover:bg-c-surface transition-all">Cancel</button>
              )}
              <button type="button" onClick={handleAdd} disabled={!form.description.trim() || form.unitPrice <= 0}
                className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 text-black text-sm font-bold rounded-xl hover:bg-amber-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {!showForm && (
        <button onClick={() => setShowForm(true)}
          className="w-full py-3 border border-dashed border-c-border-inner rounded-xl text-c-text-3 text-sm hover:border-c-border-hover hover:text-c-text-2 transition-all flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Line Item
        </button>
      )}
    </div>
  );
}

// ─── Step 4: Add-ons ──────────────────────────────────────────────────────────
function StepExtras({
  selections, onToggle, onQtyChange,
}: {
  selections: AddonSelection[];
  onToggle: (addonId: string) => void;
  onQtyChange: (addonId: string, qty: number) => void;
}) {
  const [activeCat, setActiveCat] = useState('structures');
  const catAddons = ADDONS.filter(a => a.category === activeCat);

  const isSelected = (id: string) => selections.some(s => s.addonId === id);
  const getQty = (id: string) => selections.find(s => s.addonId === id)?.quantity ?? 1;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-c-text">Extras & Add-ons</h2>
        <p className="text-c-text-3 text-sm mt-1">Optional upgrades to complete the outdoor space.</p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {ADDON_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCat(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCat === cat.id ? 'bg-c-elevated text-c-text' : 'text-c-text-3 hover:text-c-text-2'
            }`}>
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Add-on cards */}
      <div className="grid grid-cols-2 gap-3">
        {catAddons.map(addon => {
          const sel = isSelected(addon.id);
          const qty = getQty(addon.id);
          const total = addon.basePrice * qty;
          return (
            <div key={addon.id}
              className={`relative p-4 rounded-xl border transition-all ${sel ? 'border-amber-500/40 bg-amber-500/5' : 'border-c-border bg-c-card'}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{addon.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-c-text">{addon.name}</div>
                  <div className="text-[11px] text-c-text-3 mt-0.5 leading-relaxed">{addon.description}</div>
                  <div className="text-xs text-c-text-2 mt-2 font-medium">
                    {formatCurrency(total)}{addon.unit !== 'flat' ? ` · ${qty} ${addon.unit}` : ''}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3">
                {sel && addon.unit !== 'flat' && (
                  <div className="flex items-center gap-1.5 bg-c-elevated rounded-lg px-2 py-1">
                    <button onClick={() => onQtyChange(addon.id, Math.max(1, qty - 1))} className="text-c-text-3 hover:text-c-text transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs text-c-text font-medium w-6 text-center">{qty}</span>
                    <button onClick={() => onQtyChange(addon.id, qty + 1)} className="text-c-text-3 hover:text-c-text transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <button onClick={() => onToggle(addon.id)}
                  className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    sel ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-c-elevated text-c-text-3 hover:bg-c-tag hover:text-c-text'
                  }`}>
                  {sel ? <><Check className="w-3 h-3" /> Added</> : <><Plus className="w-3 h-3" /> Add</>}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 5: Review ───────────────────────────────────────────────────────────
function StepReview({
  client, projectTypes, sqFt, lineItems, addonSelections, liveTotal, onSave, saving,
}: {
  client: Record<string, string>;
  projectTypes: ProjectTypeId[];
  sqFt: number;
  lineItems: LineItem[];
  addonSelections: AddonSelection[];
  liveTotal: number;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-c-text">Review & Save</h2>
        <p className="text-c-text-3 text-sm mt-1">Confirm the details before generating the estimate.</p>
      </div>

      <div className="space-y-3">
        <div className="p-4 bg-c-card border border-c-border-inner rounded-xl">
          <div className="text-[10px] font-bold text-c-text-4 uppercase tracking-wider mb-2">Client</div>
          <div className="text-sm font-semibold text-c-text">{client.name || '—'}</div>
          <div className="text-xs text-c-text-3 mt-0.5">{client.phone}{client.email ? ` · ${client.email}` : ''}</div>
        </div>

        <div className="p-4 bg-c-card border border-c-border-inner rounded-xl">
          <div className="text-[10px] font-bold text-c-text-4 uppercase tracking-wider mb-2">Project</div>
          <div className="flex flex-wrap gap-1.5">
            {projectTypes.map(pt => (
              <span key={pt} className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full capitalize">
                {pt.replace(/-/g, ' ')}
              </span>
            ))}
          </div>
          <div className="text-xs text-c-text-3 mt-2">{sqFt.toLocaleString()} sq ft total</div>
        </div>

        {lineItems.length > 0 && (
          <div className="p-4 bg-c-card border border-c-border-inner rounded-xl">
            <div className="text-[10px] font-bold text-c-text-4 uppercase tracking-wider mb-2">Line Items ({lineItems.length})</div>
            <div className="space-y-1.5">
              {lineItems.map(item => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <span className="text-c-text-2 truncate flex-1 mr-3">{item.description}</span>
                  <span className="text-c-text-3 shrink-0">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {addonSelections.length > 0 && (
          <div className="p-4 bg-c-card border border-c-border-inner rounded-xl">
            <div className="text-[10px] font-bold text-c-text-4 uppercase tracking-wider mb-2">Add-ons ({addonSelections.length})</div>
            <div className="space-y-1.5">
              {addonSelections.map((sel, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-c-text-2">{sel.addon.name}</span>
                  <span className="text-c-text-3">{sel.quantity > 1 ? `×${sel.quantity}` : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="w-full py-4 bg-amber-500 text-black text-base font-bold rounded-2xl hover:bg-amber-400 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {saving ? 'Saving...' : <><Check className="w-5 h-5" /> Save Estimate — {formatCurrency(liveTotal)}</>}
      </button>
    </div>
  );
}

// ─── Live estimate panel ──────────────────────────────────────────────────────
function LivePanel({
  clientName, projectTypes, lineItems, addonSelections, total, sqFt,
}: {
  clientName: string;
  projectTypes: ProjectTypeId[];
  lineItems: LineItem[];
  addonSelections: AddonSelection[];
  total: number;
  sqFt: number;
}) {
  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto bg-c-surface">
      <div className="text-[10px] font-bold text-c-text-4 uppercase tracking-widest mb-4">Live Estimate</div>

      {clientName && (
        <div className="mb-4">
          <div className="text-lg font-bold text-c-text">{clientName}</div>
          {sqFt > 0 && <div className="text-xs text-c-text-4 mt-0.5">{sqFt.toLocaleString()} sq ft · {projectTypes.map(pt => pt.replace(/-/g, ' ')).join(', ')}</div>}
        </div>
      )}

      {lineItems.length === 0 && addonSelections.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div className="text-3xl mb-3">📋</div>
          <div className="text-c-text-4 text-xs">Your estimate builds here as you add line items.</div>
        </div>
      ) : (
        <div className="flex-1 space-y-4">
          {lineItems.length > 0 && (
            <div>
              <div className="text-[10px] text-c-text-4 uppercase tracking-wider font-bold mb-2">Line Items</div>
              <div className="space-y-1.5">
                {lineItems.map(item => (
                  <div key={item.id} className="flex items-baseline justify-between text-xs">
                    <span className="text-c-text-3 flex-1 min-w-0 mr-3 truncate">{item.description}</span>
                    <span className="text-c-text-2 shrink-0">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {addonSelections.length > 0 && (
            <div>
              <div className="text-[10px] text-c-text-4 uppercase tracking-wider font-bold mb-2">Add-ons</div>
              <div className="space-y-1.5">
                {addonSelections.map((sel, i) => (
                  <div key={i} className="flex items-baseline justify-between text-xs">
                    <span className="text-c-text-3 flex-1 min-w-0 mr-3 truncate">{sel.addon.name}{sel.quantity > 1 ? ` ×${sel.quantity}` : ''}</span>
                    <span className="text-c-text-2 shrink-0">{formatCurrency(sel.addon.basePrice * sel.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Total */}
      <div className="mt-auto pt-5 border-t border-c-border-inner">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-c-text-4">Est. Total (incl. tax)</span>
          <span className="text-2xl font-bold text-amber-400">{formatCurrency(total)}</span>
        </div>
        {total > 0 && (
          <div className="text-[10px] text-c-text-4 mt-1">Prices may adjust at final review</div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SmartEstimatorPage() {
  const router = useRouter();
  const { save: saveQuote } = useQuotesStore();
  const { settings, init: initSettings } = useSettingsStore();

  const [step, setStep] = useState<Step>(0);
  const [saving, setSaving] = useState(false);

  // Local state mirrors (for fast updates in this builder)
  const [clientLocal, setClientLocal] = useState<Record<string, string>>({});
  const [sqFt, setSqFt] = useState(400);
  const [demo, setDemo] = useState(false);
  const [projectTypes, setProjectTypes] = useState<ProjectTypeId[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [addons, setAddons] = useState<AddonSelection[]>([]);

  useEffect(() => {
    initSettings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const liveTotal = useMemo(() => {
    if (lineItems.length === 0 && addons.length === 0) return 0;
    return computeLiveTotal(lineItems, addons, sqFt, demo, settings);
  }, [lineItems, addons, sqFt, demo, settings]);

  const canNext = () => {
    if (step === 0) return !!(clientLocal.name?.trim() && clientLocal.phone?.trim());
    if (step === 1) return projectTypes.length > 0;
    if (step === 2) return lineItems.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < 4) setStep((step + 1) as Step);
  };

  const handleBack = () => {
    if (step > 0) setStep((step - 1) as Step);
    else router.push('/quotes/new');
  };

  const toggleAddon = (addonId: string) => {
    const addon = ADDONS.find(a => a.id === addonId);
    if (!addon) return;
    setAddons(prev => {
      const idx = prev.findIndex(s => s.addonId === addonId);
      if (idx >= 0) return prev.filter(s => s.addonId !== addonId);
      return [...prev, { addonId, addon, quantity: 1 }];
    });
  };

  const updateAddonQty = (addonId: string, qty: number) => {
    setAddons(prev => prev.map(s => s.addonId === addonId ? { ...s, quantity: qty } : s));
  };

  const handleSave = () => {
    setSaving(true);
    try {
      const now = new Date();
      const validUntil = new Date(now);
      validUntil.setDate(validUntil.getDate() + (settings.pricing.quoteValidDays ?? 30));

      const addonItems = buildLineItems(
        [], addons,
        { squareFootage: sqFt, shape: 'rectangle', slope: 'flat', access: 'easy', demo },
        settings.pricing.demolitionRate ?? 2.5,
        {},
        settings.pricing.addonPrices ?? {}
      );
      const allLineItems = [...lineItems, ...addonItems];
      const subtotal = allLineItems.reduce((s, i) => s + i.total, 0);
      const taxAmount = subtotal * (settings.pricing.taxRate / 100);
      const total = subtotal + taxAmount;

      const quoteId = generateId();
      saveQuote({
        id: quoteId,
        client: {
          id: generateId(),
          name: clientLocal.name ?? '',
          email: clientLocal.email ?? '',
          phone: clientLocal.phone ?? '',
          address: clientLocal.address ?? '',
          createdAt: now.toISOString(),
        },
        status: 'draft',
        projectTypes,
        siteConditions: { squareFootage: sqFt, shape: 'rectangle', slope: 'flat', access: 'easy', demo },
        materialSelections: [],
        addonSelections: addons,
        lineItems: allLineItems,
        subtotal,
        discountPercent: 0,
        discountAmount: 0,
        taxRate: settings.pricing.taxRate,
        taxAmount,
        total,
        notes: '',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        validUntil: validUntil.toISOString(),
        salesRep: settings.salesRep.name,
      });

      router.push(`/quotes/${quoteId}`);
    } finally {
      setSaving(false);
    }
  };

  const stepContent = [
    <StepClient key="client" client={clientLocal} onChange={(k, v) => setClientLocal(p => ({ ...p, [k]: v }))} />,
    <StepProject key="project" projectTypes={projectTypes} sqFt={sqFt} demo={demo}
      onToggleType={id => setProjectTypes(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])}
      onSqFt={setSqFt} onDemo={setDemo} />,
    <StepLineItems key="lineitems" lineItems={lineItems}
      onAdd={item => setLineItems(p => [...p, item])}
      onRemove={id => setLineItems(p => p.filter(i => i.id !== id))} />,
    <StepExtras key="extras" selections={addons} onToggle={toggleAddon} onQtyChange={updateAddonQty} />,
    <StepReview key="review" client={clientLocal} projectTypes={projectTypes} sqFt={sqFt}
      lineItems={lineItems} addonSelections={addons} liveTotal={liveTotal}
      onSave={handleSave} saving={saving} />,
  ];

  return (
    <AppShell>
      <div className="h-full flex flex-col" style={{ background: 'var(--background)' }}>

        {/* Top bar */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-c-border-inner shrink-0 bg-c-card">
          <button onClick={handleBack} className="p-1.5 rounded-lg hover:bg-c-elevated text-c-text-4 hover:text-c-text transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 flex items-center gap-0">
            {STEPS.map((label, i) => {
              const done = i < step;
              const active = i === step;
              const last = i === STEPS.length - 1;
              return (
                <div key={label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                      done ? 'bg-amber-500 text-black' : active ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-400' : 'bg-c-elevated text-c-text-4'
                    }`}>
                      {done ? <Check className="w-3 h-3" /> : i + 1}
                    </div>
                    <span className={`text-[10px] mt-1 font-medium ${active ? 'text-amber-400' : done ? 'text-c-text-3' : 'text-c-text-4'}`}>{label}</span>
                  </div>
                  {!last && <div className={`flex-1 h-px mx-2 mb-3 transition-all ${done ? 'bg-amber-500/50' : 'bg-c-border-inner'}`} />}
                </div>
              );
            })}
          </div>
          <div className="text-xs text-c-text-4">{step + 1} of {STEPS.length}</div>
        </div>

        {/* Body: form left + live panel right */}
        <div className="flex-1 flex overflow-hidden">
          {/* Form */}
          <div className="flex-1 overflow-y-auto p-8 max-w-2xl">
            {stepContent[step]}

            {/* Nav buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-c-border-inner">
              <button onClick={handleBack}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-c-border-input text-c-text-3 text-sm font-medium hover:text-c-text hover:border-c-border-hover transition-all">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              {step < 4 && (
                <button onClick={handleNext} disabled={!canNext()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-black text-sm font-bold rounded-xl hover:bg-amber-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  {step === 3 ? 'Review' : 'Continue'} <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Live panel */}
          <div className="w-72 shrink-0 border-l border-c-border-inner overflow-hidden">
            <LivePanel
              clientName={clientLocal.name ?? ''}
              projectTypes={projectTypes}
              lineItems={lineItems}
              addonSelections={addons}
              total={liveTotal}
              sqFt={sqFt}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
