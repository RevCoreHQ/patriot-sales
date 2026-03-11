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

const EMPTY_FORM = { description: '', category: 'material' as LineItem['category'], quantity: 1, unit: 'sq ft', unitPrice: 0 };

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
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const categoryColor = (cat: LineItem['category']) =>
    CATEGORIES.find(c => c.value === cat)?.color ?? 'text-neutral-400';

  const grandTotal = manualLineItems.reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-c-text">Line Items</h2>
        <p className="text-sm text-c-text-3 mt-1">Add each cost item for this project — materials, labor, and anything else.</p>
      </div>

      {/* Existing items */}
      {manualLineItems.length > 0 && (
        <div className="bg-c-card border border-c-border-inner rounded-xl overflow-hidden">
          <div className="divide-y divide-c-border-inner">
            {manualLineItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-c-text truncate">{item.description}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs capitalize ${categoryColor(item.category)}`}>{item.category}</span>
                    {item.unit !== 'flat' && (
                      <span className="text-xs text-c-text-4">
                        {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm font-semibold text-c-text shrink-0">{formatCurrency(item.total)}</div>
                <button onClick={() => removeManualLineItem(item.id)}
                  className="p-1 text-c-text-4 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-c-border-inner flex justify-between items-center bg-c-surface">
            <span className="text-xs font-medium text-c-text-3 uppercase tracking-wider">Subtotal</span>
            <span className="text-base font-bold text-c-text">{formatCurrency(grandTotal)}</span>
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
        <div className="bg-c-card border border-c-border-inner rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-c-text-3 uppercase tracking-wider">New Line Item</div>

          {/* Description */}
          <div>
            <label className="text-xs text-c-text-3 mb-1.5 block">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="e.g. Belgard Cambridge Cobble — Main Patio"
              className="w-full bg-c-input border border-c-border-input rounded-lg px-3 py-2 text-sm text-c-text placeholder:text-c-text-4 focus:outline-none focus:border-amber-500/50"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-c-text-3 mb-1.5 block">Category</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => (
                <button key={cat.value} type="button" onClick={() => setForm(p => ({ ...p, category: cat.value }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    form.category === cat.value
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                      : 'border-c-border-inner text-c-text-3 hover:border-c-border-hover'
                  }`}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Qty / Unit / Price row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-c-text-3 mb-1.5 block">Qty</label>
              <input type="number" min="0" step="1" value={form.quantity}
                onChange={e => setForm(p => ({ ...p, quantity: Number(e.target.value) || 1 }))}
                className="w-full bg-c-input border border-c-border-input rounded-lg px-3 py-2 text-sm text-c-text focus:outline-none focus:border-amber-500/50" />
            </div>
            <div>
              <label className="text-xs text-c-text-3 mb-1.5 block">Unit</label>
              <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                className="w-full bg-c-input border border-c-border-input rounded-lg px-3 py-2 text-sm text-c-text focus:outline-none focus:border-amber-500/50">
                {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-c-text-3 mb-1.5 block">Unit Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-c-text-3 text-sm">$</span>
                <input type="number" min="0" step="0.01" value={form.unitPrice || ''}
                  onChange={e => setForm(p => ({ ...p, unitPrice: Number(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="w-full bg-c-input border border-c-border-input rounded-lg pl-7 pr-3 py-2 text-sm text-c-text placeholder:text-c-text-4 focus:outline-none focus:border-amber-500/50" />
              </div>
            </div>
          </div>

          {/* Total preview + actions */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-sm text-c-text-3">
              Total: <span className="font-bold text-c-text">{formatCurrency(total)}</span>
            </div>
            <div className="flex gap-2">
              {manualLineItems.length > 0 && (
                <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                  className="px-4 py-1.5 bg-c-elevated text-c-text-3 text-xs rounded-lg hover:bg-c-surface transition-all">
                  Cancel
                </button>
              )}
              <button type="button" onClick={handleAdd}
                disabled={!form.description.trim() || form.unitPrice <= 0}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-lg hover:bg-amber-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show add form button */}
      {!showForm && (
        <button onClick={() => setShowForm(true)}
          className="w-full py-3 border border-dashed border-c-border-inner rounded-xl text-c-text-3 text-sm hover:border-c-border-hover hover:text-c-text-2 transition-all flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Line Item
        </button>
      )}
    </div>
  );
}
