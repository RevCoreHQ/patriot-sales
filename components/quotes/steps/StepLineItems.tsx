'use client';

import { useState } from 'react';
import { useWizardStore } from '@/store/wizard';
import { formatCurrency, generateId } from '@/lib/utils';
import type { LineItem } from '@/types';
import { Plus, Trash2, Receipt } from 'lucide-react';

const CATEGORIES: { value: LineItem['category']; label: string; color: string }[] = [
  { value: 'material', label: 'Material',  color: 'text-blue-400' },
  { value: 'labor',    label: 'Labor',     color: 'text-emerald-400' },
  { value: 'addon',    label: 'Add-on',    color: 'text-purple-400' },
  { value: 'misc',     label: 'Misc',      color: 'text-neutral-400' },
];

const COMMON_UNITS = ['sq ft', 'linear ft', 'each', 'flat', 'hr', 'ton'];

const EMPTY_FORM = { description: '', category: 'material' as LineItem['category'], quantity: 1, unit: 'sq ft', unitPrice: 0, costPerUnit: undefined as number | undefined };

export function StepLineItems() {
  const { manualLineItems, addManualLineItem, removeManualLineItem } = useWizardStore();
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(manualLineItems.length === 0);

  const total = form.quantity * form.unitPrice;

  const handleAdd = () => {
    if (!form.description.trim() || form.unitPrice <= 0) return;
    addManualLineItem({
      id: generateId(),
      description: form.description.trim(),
      category: form.category,
      quantity: form.quantity,
      unit: form.unit,
      unitPrice: form.unitPrice,
      total: form.quantity * form.unitPrice,
      costPerUnit: form.costPerUnit,
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const categoryColor = (cat: LineItem['category']) =>
    CATEGORIES.find(c => c.value === cat)?.color ?? 'text-neutral-400';

  const grandTotal = manualLineItems.reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-c-text">Line Items</h2>
        <p className="text-base text-c-text-3 mt-1">Add each cost item for this project — materials, labor, and anything else.</p>
      </div>

      {/* Existing items */}
      {manualLineItems.length > 0 && (
        <div className="bg-c-card border border-c-border-inner rounded-xl overflow-hidden">
          <div className="divide-y divide-c-border-inner">
            {manualLineItems.map(item => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="text-base font-medium text-c-text truncate">{item.description}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-sm capitalize ${categoryColor(item.category)}`}>{item.category}</span>
                    {item.unit !== 'flat' && (
                      <span className="text-xs text-c-text-4">
                        {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-base font-semibold text-c-text shrink-0">{formatCurrency(item.total)}</div>
                <button onClick={() => removeManualLineItem(item.id)}
                  className="p-2 text-c-text-4 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 border-t border-c-border-inner flex justify-between items-center bg-c-surface">
            <span className="text-sm font-medium text-c-text-3 uppercase tracking-wider">Subtotal</span>
            <span className="text-lg font-bold text-c-text">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {manualLineItems.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-12 bg-c-card border border-c-border-inner rounded-xl">
          <Receipt className="w-8 h-8 text-c-text-4 mb-3" />
          <div className="text-sm text-c-text-3">No line items yet</div>
        </div>
      )}

      {/* Add item form */}
      {showForm && (
        <div className="bg-c-card border border-c-border-inner rounded-xl p-5 space-y-4">
          <div className="text-sm font-semibold text-c-text-3 uppercase tracking-wider">New Line Item</div>

          {/* Description */}
          <div>
            <label className="text-sm text-c-text-3 mb-2 block">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="e.g. GAF Timberline HDZ — Main Roof"
              className="w-full h-14 bg-c-input border border-c-border-input rounded-2xl px-4 text-base text-c-text placeholder:text-c-text-4 focus:outline-none focus:border-accent-secondary/50"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm text-c-text-3 mb-2 block">Category</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => (
                <button key={cat.value} type="button" onClick={() => setForm(p => ({ ...p, category: cat.value }))}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    form.category === cat.value
                      ? 'border-accent-secondary/40 bg-accent-secondary/10 text-accent-secondary'
                      : 'border-c-border-inner text-c-text-3 hover:border-c-border-hover'
                  }`}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Qty / Unit / Price / Cost row */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-c-text-3 mb-2 block">Qty</label>
              <input type="number" min="0" step="1" value={form.quantity || ''}
                onChange={e => setForm(p => ({ ...p, quantity: e.target.value === '' ? 0 : Number(e.target.value) }))}
                className="w-full h-14 bg-c-input border border-c-border-input rounded-2xl px-4 text-base text-c-text focus:outline-none focus:border-accent-secondary/50" />
            </div>
            <div>
              <label className="text-sm text-c-text-3 mb-2 block">Unit</label>
              <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                className="w-full h-14 bg-c-input border border-c-border-input rounded-2xl px-4 text-base text-c-text focus:outline-none focus:border-accent-secondary/50">
                {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-c-text-3 mb-2 block">Unit Price</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-c-text-3 text-base">$</span>
                <input type="number" min="0" step="0.01" value={form.unitPrice || ''}
                  onChange={e => setForm(p => ({ ...p, unitPrice: Number(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="w-full h-14 bg-c-input border border-c-border-input rounded-2xl pl-8 pr-4 text-base text-c-text placeholder:text-c-text-4 focus:outline-none focus:border-accent-secondary/50" />
              </div>
            </div>
            <div>
              <label className="text-sm text-c-text-3 mb-2 block">Cost (opt.)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-c-text-3 text-base">$</span>
                <input type="number" min="0" step="0.01" value={form.costPerUnit ?? ''}
                  onChange={e => setForm(p => ({ ...p, costPerUnit: e.target.value === '' ? undefined : Number(e.target.value) }))}
                  placeholder="—"
                  className="w-full h-14 bg-c-input border border-c-border-input rounded-2xl pl-8 pr-4 text-base text-c-text placeholder:text-c-text-4 focus:outline-none focus:border-accent-secondary/50" />
              </div>
            </div>
          </div>

          {/* Total preview + actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-base text-c-text-3">
              Total: <span className="font-bold text-c-text">{formatCurrency(total)}</span>
            </div>
            <div className="flex gap-3">
              {manualLineItems.length > 0 && (
                <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                  className="px-5 py-2.5 bg-c-elevated text-c-text-3 text-sm rounded-xl hover:bg-c-surface transition-all">
                  Cancel
                </button>
              )}
              <button type="button" onClick={handleAdd}
                disabled={!form.description.trim() || form.unitPrice <= 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-accent-from to-accent-to text-white text-sm font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show add form button */}
      {!showForm && (
        <button onClick={() => setShowForm(true)}
          className="w-full py-4 border border-dashed border-c-border-inner rounded-xl text-c-text-3 text-base hover:border-accent-secondary/40 hover:text-accent-secondary transition-all flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" /> Add Line Item
        </button>
      )}
    </div>
  );
}
