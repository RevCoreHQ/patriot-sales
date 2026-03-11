'use client';

import { useEffect, useRef, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useProjectsStore } from '@/store/projects';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import type { Project, ProjectPhase, ProjectTodo, CloseoutItem, PaymentType, PaymentMethod } from '@/types';
import {
  Hammer, CheckCircle2, DollarSign, Truck, FileText, Calendar,
  Plus, X, ChevronDown, Link2, ClipboardList, ListTodo, Clock,
  Trash2, Check, CreditCard, Banknote,
} from 'lucide-react';

const PAYMENT_TYPES: { value: PaymentType; label: string }[] = [
  { value: 'deposit',  label: 'Deposit' },
  { value: 'stage-1',  label: 'Stage Payment 1' },
  { value: 'stage-2',  label: 'Stage Payment 2' },
  { value: 'stage-3',  label: 'Stage Payment 3' },
  { value: 'final',    label: 'Final Payment' },
  { value: 'other',    label: 'Other' },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'cash',          label: 'Cash',        icon: '\ud83d\udcb5' },
  { value: 'check',         label: 'Check',       icon: '\ud83d\udcdd' },
  { value: 'credit-card',   label: 'Credit Card', icon: '\ud83d\udcb3' },
  { value: 'ach',           label: 'ACH / Bank',  icon: '\ud83c\udfe6' },
  { value: 'zelle',         label: 'Zelle',       icon: '\u26a1' },
  { value: 'venmo',         label: 'Venmo',       icon: '\ud83d\udc99' },
];

const PHASES: { id: ProjectPhase; label: string; short: string; color: string; ring: string }[] = [
  { id: 'design-review', label: 'Design Review', short: 'Design',  color: 'text-blue-400',    ring: 'border-blue-500/50 bg-blue-500/10' },
  { id: 'permitting',    label: 'Permitting',     short: 'Permit',  color: 'text-yellow-400',  ring: 'border-yellow-500/50 bg-yellow-500/10' },
  { id: 'site-prep',     label: 'Site Prep',      short: 'Prep',    color: 'text-orange-400',  ring: 'border-orange-500/50 bg-orange-500/10' },
  { id: 'installation',  label: 'Installation',   short: 'Install', color: 'text-purple-400',  ring: 'border-purple-500/50 bg-purple-500/10' },
  { id: 'finishing',     label: 'Finishing',      short: 'Finish',  color: 'text-teal-400',    ring: 'border-teal-500/50 bg-teal-500/10' },
  { id: 'delivered',     label: 'Delivered',      short: 'Done',    color: 'text-emerald-400', ring: 'border-emerald-500/50 bg-emerald-500/10' },
];

function phaseIndex(id: ProjectPhase) { return PHASES.findIndex(p => p.id === id); }
function phaseInfo(id: ProjectPhase) { return PHASES[phaseIndex(id)] ?? PHASES[0]; }

function DatePickerInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="text-xs text-c-text-3 mb-1.5 block">{label}</label>
      <div className="relative">
        <input ref={ref} type="date" value={value} onChange={e => onChange(e.target.value)}
          className="w-full bg-c-input border border-c-border-input rounded-xl pl-3 pr-9 py-2.5 text-sm text-c-text focus:outline-none focus:border-amber-500/60" />
        <button type="button" onClick={() => ref.current?.showPicker?.()} className="absolute right-3 top-1/2 -translate-y-1/2 text-c-text-4 active:text-amber-400 transition-colors">
          <Calendar className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Project Detail (right panel) ────────────────────────────────────────────
function ProjectDetail({ project }: { project: Project }) {
  const {
    updatePhase, addUpdate, setDates, setCashCollected, setGhlContactId,
    addTodo, toggleTodo, removeTodo, toggleCloseout, addPayment, removePayment, remove,
  } = useProjectsStore();

  const [tab, setTab] = useState<'overview' | 'todos' | 'closeout' | 'finance' | 'notes'>('overview');
  const [noteText, setNoteText] = useState('');
  const [todoText, setTodoText] = useState('');
  const [editing, setEditing] = useState(false);
  const [estDate, setEstDate] = useState(project.estimatedCompletion?.slice(0, 10) ?? '');
  const [startDate, setStartDate] = useState(project.startDate?.slice(0, 10) ?? '');
  const [cash, setCash] = useState(String(project.cashCollected));
  const [ghlId, setGhlId] = useState(project.ghlContactId ?? '');
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState<PaymentType>('deposit');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [payNote, setPayNote] = useState('');
  const payments = project.payments ?? [];

  const pct = project.totalValue > 0 ? Math.min(100, (project.cashCollected / project.totalValue) * 100) : 0;
  const pi = phaseIndex(project.phase);
  const info = phaseInfo(project.phase);
  const closeoutDone = project.closeoutChecklist.filter(c => c.completed).length;
  const closeoutTotal = project.closeoutChecklist.length;
  const todoDone = project.todos.filter(t => t.completed).length;
  const canDeliver = project.phase === 'finishing' && closeoutDone === closeoutTotal;

  const submitNote = () => { if (!noteText.trim()) return; addUpdate(project.id, project.phase, noteText.trim()); setNoteText(''); };
  const submitTodo = () => { if (!todoText.trim()) return; addTodo(project.id, todoText.trim()); setTodoText(''); };
  const saveEdits = () => {
    setDates(project.id, { startDate: startDate ? new Date(startDate + 'T12:00:00').toISOString() : undefined, estimatedCompletion: estDate ? new Date(estDate + 'T12:00:00').toISOString() : undefined });
    if (payments.length === 0) setCashCollected(project.id, Number(cash) || 0);
    if (ghlId !== project.ghlContactId) setGhlContactId(project.id, ghlId);
    setEditing(false);
  };
  const submitPayment = () => { const amt = parseFloat(payAmount); if (!amt || amt <= 0) return; addPayment(project.id, amt, payType, payMethod, payNote); setPayAmount(''); setPayNote(''); };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-c-text">{project.clientName}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              {project.projectTypes.map(pt => (
                <span key={pt} className="text-[11px] bg-c-elevated text-c-text-3 px-2.5 py-1 rounded-full capitalize">{pt.replace(/-/g, ' ')}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-bold text-c-text">{formatCurrency(project.totalValue)}</span>
            <span className={`text-sm font-medium px-3 py-1.5 rounded-full border ${info.ring} ${info.color}`}>{info.label}</span>
          </div>
        </div>

        {/* Phase pipeline */}
        <div className="mt-5 flex items-center gap-0">
          {PHASES.map((p, i) => {
            const done = i < pi; const active = i === pi; const isLast = i === PHASES.length - 1;
            return (
              <div key={p.id} className="flex items-center flex-1">
                <button onClick={() => updatePhase(project.id, p.id)} title={p.label} className="relative flex flex-col items-center group flex-1">
                  <div className={`w-4 h-4 rounded-full border-2 transition-all ${done ? 'bg-amber-500 border-amber-500' : active ? 'bg-amber-500/30 border-amber-400 ring-2 ring-amber-500/20' : 'bg-transparent border-c-border-input group-active:border-c-border-hover'}`} />
                  <span className={`text-[11px] mt-1 font-medium whitespace-nowrap transition-colors ${done ? 'text-amber-400' : active ? 'text-amber-300' : 'text-c-text-5 group-active:text-c-text-4'}`}>{p.short}</span>
                </button>
                {!isLast && <div className={`h-0.5 flex-1 mx-0.5 rounded transition-all ${done ? 'bg-amber-500' : 'bg-c-border-inner'}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics */}
      <div className="px-6 pb-4 grid grid-cols-3 gap-3 shrink-0">
        <div className="bg-c-surface border border-c-border-inner rounded-2xl p-4">
          <div className="text-xs text-c-text-4 mb-0.5">Cash Collected</div>
          <div className="text-lg font-bold text-c-text">{formatCurrency(project.cashCollected)}</div>
          <div className="mt-2 h-1.5 rounded-full bg-c-border-inner"><div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} /></div>
          <div className="text-xs text-c-text-4 mt-1">{pct.toFixed(0)}% of total</div>
        </div>
        <div className="bg-c-surface border border-c-border-inner rounded-2xl p-4">
          <div className="text-xs text-c-text-4 mb-0.5">Est. Completion</div>
          <div className="text-lg font-bold text-c-text">{project.estimatedCompletion ? formatDateShort(project.estimatedCompletion) : '—'}</div>
          {project.startDate && <div className="text-xs text-c-text-4 mt-1">Start: {formatDateShort(project.startDate)}</div>}
        </div>
        <div className="bg-c-surface border border-c-border-inner rounded-2xl p-4">
          <div className="text-xs text-c-text-4 mb-0.5">Closeout</div>
          <div className="text-lg font-bold text-c-text">{closeoutDone}/{closeoutTotal}</div>
          <div className="mt-2 h-1.5 rounded-full bg-c-border-inner"><div className={`h-full rounded-full transition-all ${closeoutDone === closeoutTotal ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${closeoutTotal > 0 ? (closeoutDone / closeoutTotal) * 100 : 0}%` }} /></div>
          <div className="text-xs text-c-text-4 mt-1">items complete</div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-6 pb-3 flex items-center gap-1 border-t border-c-border-inner pt-3 shrink-0">
        {([
          { key: 'overview', label: 'Overview', icon: Clock },
          { key: 'todos', label: `To-do${project.todos.length > 0 ? ` (${todoDone}/${project.todos.length})` : ''}`, icon: ListTodo },
          { key: 'closeout', label: 'Closeout', icon: ClipboardList },
          { key: 'finance', label: `Finance${payments.length > 0 ? ` (${payments.length})` : ''}`, icon: DollarSign },
          { key: 'notes', label: 'Notes', icon: FileText },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-1.5 h-12 px-4 rounded-2xl text-sm font-medium transition-all ${tab === key ? 'bg-c-elevated text-c-text' : 'text-c-text-4 active:text-c-text-2'}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={() => setEditing(!editing)} className={`flex items-center gap-1.5 h-12 px-4 rounded-2xl text-sm font-medium transition-all ${editing ? 'bg-amber-500/15 text-amber-400' : 'text-c-text-4 active:text-c-text-2'}`}>
          <Calendar className="w-3.5 h-3.5" />Edit
        </button>
        {project.phase !== 'delivered' && (
          <button onClick={() => { if (project.phase === 'finishing' && !canDeliver) { alert('Complete all closeout items first.'); setTab('closeout'); return; } const idx = phaseIndex(project.phase); if (idx < PHASES.length - 1) updatePhase(project.id, PHASES[idx + 1].id); }}
            className="flex items-center gap-1.5 h-12 px-5 rounded-2xl text-sm font-semibold bg-amber-500/15 text-amber-400 active:bg-amber-500/25 transition-all">
            <ChevronDown className="w-3.5 h-3.5 rotate-[-90deg]" />Next Phase
          </button>
        )}
      </div>

      {/* Tab content (scrollable) */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Edit panel */}
        {editing && (
          <div className="bg-c-surface border border-c-border-inner rounded-2xl p-5 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3"><DatePickerInput label="Start Date" value={startDate} onChange={setStartDate} /><DatePickerInput label="Est. Completion" value={estDate} onChange={setEstDate} /></div>
            <div className="grid grid-cols-2 gap-3">
              {payments.length === 0 && <div><label className="text-xs text-c-text-3 mb-1.5 block">Cash Collected ($)</label><input type="number" value={cash} onChange={e => setCash(e.target.value)} className="w-full bg-c-input border border-c-border-input rounded-xl px-3 py-2.5 text-sm text-c-text focus:outline-none focus:border-amber-500/60" /></div>}
              <div className={payments.length === 0 ? '' : 'col-span-2'}><label className="text-xs text-c-text-4 mb-1.5 flex items-center gap-1"><Link2 className="w-3 h-3" /> GHL Contact ID</label><input type="text" value={ghlId} onChange={e => setGhlId(e.target.value)} className="w-full bg-c-input border border-c-border-input rounded-xl px-3 py-2.5 text-sm text-c-text font-mono focus:outline-none focus:border-amber-500/60" /></div>
            </div>
            <div className="flex gap-2"><button onClick={saveEdits} className="h-12 px-6 bg-amber-500 text-black text-sm font-bold rounded-2xl active:bg-amber-400 active:scale-[0.97] transition-all">Save</button><button onClick={() => setEditing(false)} className="h-12 px-5 bg-c-elevated text-c-text-3 text-sm rounded-2xl active:bg-c-surface transition-all">Cancel</button></div>
          </div>
        )}

        {/* Overview */}
        {tab === 'overview' && (
          <div>
            {project.updates.length === 0 ? <div className="text-xs text-c-text-4 py-3">No updates yet.</div> : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto">{project.updates.map(u => (
                <div key={u.id} className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 mt-1.5 shrink-0" /><div><div className="text-sm text-c-text-2">{u.note}</div><div className="text-[11px] text-c-text-4 mt-0.5">{formatDateShort(u.date)} · <span className="capitalize">{u.phase.replace(/-/g, ' ')}</span></div></div></div>
              ))}</div>
            )}
            {project.phase !== 'delivered' && (
              <div className="flex gap-2 mt-4 border-t border-c-border-inner pt-4">
                <input value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitNote()} placeholder="Add a project update note..." className="flex-1 h-12 bg-c-surface border border-c-border-inner rounded-2xl px-4 text-sm text-c-text placeholder:text-c-text-4 focus:outline-none focus:border-amber-500/50" />
                <button onClick={submitNote} className="h-12 px-6 bg-amber-500 text-black text-sm font-bold rounded-2xl active:bg-amber-400 active:scale-[0.97] transition-all">Post</button>
              </div>
            )}
          </div>
        )}

        {/* Todos */}
        {tab === 'todos' && (
          <div>
            {project.todos.length > 0 && (
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">{project.todos.map((t: ProjectTodo) => (
                <div key={t.id} className="flex items-center gap-3 group">
                  <button onClick={() => toggleTodo(project.id, t.id)} className={`w-7 h-7 rounded-lg border flex-shrink-0 flex items-center justify-center transition-all ${t.completed ? 'bg-emerald-500 border-emerald-500' : 'border-c-border-input active:border-c-border-hover'}`}>{t.completed && <Check className="w-3.5 h-3.5 text-white" />}</button>
                  <span className={`text-sm flex-1 ${t.completed ? 'line-through text-c-text-3' : 'text-c-text'}`}>{t.text}</span>
                  <button onClick={() => removeTodo(project.id, t.id)} className="w-9 h-9 flex items-center justify-center text-c-text-5 active:text-red-400 transition-all"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}</div>
            )}
            <div className="flex gap-2 border-t border-c-border-inner pt-4">
              <input value={todoText} onChange={e => setTodoText(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitTodo()} placeholder="Add a task..." className="flex-1 h-12 bg-c-surface border border-c-border-inner rounded-2xl px-4 text-sm text-c-text placeholder:text-c-text-4 focus:outline-none focus:border-amber-500/50" />
              <button onClick={submitTodo} className="h-12 w-12 flex items-center justify-center bg-amber-500 text-black font-bold rounded-2xl active:bg-amber-400 active:scale-[0.97] transition-all"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* Closeout */}
        {tab === 'closeout' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-c-text-4">Complete all items before delivery.</div>
              {closeoutDone === closeoutTotal && <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> All complete</span>}
            </div>
            <div className="space-y-2">{project.closeoutChecklist.map((item: CloseoutItem) => (
              <button key={item.id} onClick={() => toggleCloseout(project.id, item.id)} className={`w-full flex items-center gap-3 text-left px-5 py-4 rounded-2xl border transition-all group ${item.completed ? 'bg-emerald-500/[0.06] border-emerald-500/20' : 'bg-c-surface border-c-border-inner active:border-c-border-hover'}`}>
                <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-c-border-input group-active:border-c-border-hover'}`}>{item.completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}</div>
                <span className={`text-sm font-medium transition-colors ${item.completed ? 'text-c-text-3 line-through' : 'text-c-text'}`}>{item.label}</span>
              </button>
            ))}</div>
            {canDeliver && <button onClick={() => updatePhase(project.id, 'delivered')} className="mt-4 w-full h-14 bg-emerald-500 text-white text-base font-bold rounded-2xl active:bg-emerald-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" />Mark Delivered</button>}
          </div>
        )}

        {/* Finance */}
        {tab === 'finance' && (
          <div>
            <div className="bg-c-surface border border-c-border-inner rounded-2xl p-5 mb-4">
              <div className="text-xs font-semibold text-c-text-3 mb-3 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" />Record Payment</div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div><label className="text-[10px] text-c-text-4 mb-1.5 block">Amount ($)</label><input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitPayment()} placeholder="0.00" className="w-full h-12 bg-c-input border border-c-border-input rounded-2xl px-4 text-sm text-c-text focus:outline-none focus:border-amber-500/60" /></div>
                <div><label className="text-[10px] text-c-text-4 mb-1.5 block">Payment For</label><select value={payType} onChange={e => setPayType(e.target.value as PaymentType)} className="w-full h-12 bg-c-input border border-c-border-input rounded-2xl px-4 text-sm text-c-text focus:outline-none focus:border-amber-500/60">{PAYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
              </div>
              <div className="mb-3"><label className="text-[10px] text-c-text-4 mb-1.5 block">Payment Method</label><div className="grid grid-cols-3 gap-2">{PAYMENT_METHODS.map(m => (
                <button key={m.value} onClick={() => setPayMethod(m.value)} className={`flex items-center gap-2 h-12 px-3 rounded-2xl text-xs font-medium transition-all border ${payMethod === m.value ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'bg-c-input border-c-border-input text-c-text-3 active:border-c-border-hover'}`}><span>{m.icon}</span>{m.label}</button>
              ))}</div></div>
              <div className="mb-3"><label className="text-[10px] text-c-text-4 mb-1.5 block">Note (optional)</label><input type="text" value={payNote} onChange={e => setPayNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitPayment()} placeholder="e.g. check #1042" className="w-full h-12 bg-c-input border border-c-border-input rounded-2xl px-4 text-sm text-c-text placeholder:text-c-text-4 focus:outline-none focus:border-amber-500/60" /></div>
              <button onClick={submitPayment} disabled={!payAmount || parseFloat(payAmount) <= 0} className="w-full h-14 bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-black text-base font-bold rounded-2xl active:bg-amber-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2"><Banknote className="w-4 h-4" />Record Payment</button>
            </div>
            {payments.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-2"><div className="text-xs text-c-text-4 uppercase tracking-wider font-semibold">Transaction History</div><div className="text-sm font-bold text-emerald-400">Total: {formatCurrency(payments.reduce((s, p) => s + p.amount, 0))}</div></div>
                <div className="space-y-2 max-h-56 overflow-y-auto">{[...payments].reverse().map(tx => {
                  const typeLabel = PAYMENT_TYPES.find(t => t.value === tx.type)?.label ?? tx.type;
                  const methodInfo = PAYMENT_METHODS.find(m => m.value === tx.method);
                  return (
                    <div key={tx.id} className="flex items-center gap-3 bg-c-surface border border-c-border-inner rounded-2xl px-4 py-3 group">
                      <div className="text-lg shrink-0">{methodInfo?.icon ?? '\ud83d\udcb0'}</div>
                      <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="text-sm font-bold text-c-text">{formatCurrency(tx.amount)}</span><span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium">{typeLabel}</span><span className="text-xs text-c-text-4">{methodInfo?.label}</span></div>{tx.note && <div className="text-xs text-c-text-4 mt-0.5 truncate">{tx.note}</div>}<div className="text-xs text-c-text-5 mt-0.5">{formatDateShort(tx.date)}</div></div>
                      <button onClick={() => { if (confirm('Remove this payment?')) removePayment(project.id, tx.id); }} className="w-9 h-9 flex items-center justify-center text-c-text-5 active:text-red-400 transition-all shrink-0"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  );
                })}</div>
              </>
            )}
          </div>
        )}

        {/* Notes */}
        {tab === 'notes' && (
          <div>{project.updates.length === 0 ? <div className="text-xs text-c-text-4 py-3">No notes logged yet.</div> : (
            <div className="space-y-3 max-h-72 overflow-y-auto">{project.updates.map(u => (
              <div key={u.id} className="bg-c-surface border border-c-border-inner rounded-2xl px-5 py-4"><div className="text-sm text-c-text-2 mb-1">{u.note}</div><div className="text-[11px] text-c-text-4">{formatDateShort(u.date)} · <span className="capitalize">{u.phase.replace(/-/g, ' ')}</span></div></div>
            ))}</div>
          )}</div>
        )}

        {/* Delivered banner */}
        {project.phase === 'delivered' && (
          <div className="mt-4 flex items-center gap-3 px-5 py-4 bg-emerald-500/8 border border-emerald-500/25 rounded-2xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-sm text-emerald-400 font-medium">Delivered{project.actualCompletion ? ` on ${formatDateShort(project.actualCompletion)}` : ''}</div>
            <button onClick={() => { if (confirm('Remove this project?')) remove(project.id); }} className="ml-auto w-9 h-9 flex items-center justify-center text-c-text-5 active:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const { projects, init } = useProjectsStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ProjectPhase | 'all'>('all');

  useEffect(() => { init(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (projects.length > 0 && !selectedId) setSelectedId(projects[0]?.id ?? null); }, [projects, selectedId]);

  const filtered = filter === 'all' ? projects : projects.filter(p => p.phase === filter);
  const selected = projects.find(p => p.id === selectedId);

  const stats = {
    active: projects.filter(p => p.phase !== 'delivered').length,
    delivered: projects.filter(p => p.phase === 'delivered').length,
    revenue: projects.reduce((s, p) => s + p.totalValue, 0),
    collected: projects.reduce((s, p) => s + p.cashCollected, 0),
  };

  return (
    <AppShell>
      {projects.length === 0 ? (
        <div className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-2xl font-bold text-c-text mb-2">Jobs</h1>
          <div className="flex flex-col items-center justify-center py-20 bg-c-card border border-c-border rounded-2xl text-center">
            <Hammer className="w-12 h-12 text-c-text-5 mb-4" />
            <div className="text-c-text-3 text-base font-medium mb-1">No projects yet</div>
            <div className="text-c-text-4 text-sm max-w-xs mb-4">Accept a quote and move it to projects to start tracking here.</div>
          </div>
        </div>
      ) : (
        <div className="flex h-full">
          {/* Left panel — project list */}
          <div className="w-[380px] shrink-0 border-r border-c-border-inner flex flex-col h-full overflow-hidden">
            <div className="p-5 shrink-0">
              <h1 className="text-xl font-bold text-c-text mb-3">Jobs</h1>
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { label: 'Active', value: String(stats.active), color: 'text-amber-400' },
                  { label: 'Collected', value: formatCurrency(stats.collected), color: 'text-emerald-400' },
                ].map(m => (
                  <div key={m.label} className="bg-c-surface border border-c-border-inner rounded-2xl px-4 py-3">
                    <div className="text-[10px] text-c-text-4 uppercase tracking-wider font-medium mb-0.5">{m.label}</div>
                    <div className={`text-base font-bold ${m.color}`}>{m.value}</div>
                  </div>
                ))}
              </div>
              {/* Filter tabs */}
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setFilter('all')} className={`h-10 px-3 text-xs font-semibold rounded-xl transition-all ${filter === 'all' ? 'bg-amber-500/12 text-amber-400 border border-amber-500/25' : 'bg-c-card text-c-text-4 border border-c-border active:bg-c-surface'}`}>All ({projects.length})</button>
                {PHASES.slice(0, -1).map(p => {
                  const count = projects.filter(proj => proj.phase === p.id).length;
                  if (count === 0) return null;
                  return <button key={p.id} onClick={() => setFilter(p.id)} className={`h-10 px-3 text-xs font-semibold rounded-xl transition-all ${filter === p.id ? 'bg-amber-500/12 text-amber-400 border border-amber-500/25' : 'bg-c-card text-c-text-4 border border-c-border active:bg-c-surface'}`}>{p.short} ({count})</button>;
                })}
              </div>
            </div>
            {/* Project list */}
            <div className="flex-1 overflow-y-auto">
              {filtered.map(p => {
                const info = phaseInfo(p.phase);
                const isSelected = p.id === selectedId;
                const pct = p.totalValue > 0 ? Math.min(100, (p.cashCollected / p.totalValue) * 100) : 0;
                return (
                  <button key={p.id} onClick={() => setSelectedId(p.id)} className={`w-full text-left px-5 py-4 border-b border-c-border-inner transition-colors ${isSelected ? 'bg-c-surface' : 'active:bg-c-surface/50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-c-text truncate">{p.clientName}</span>
                      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${info.ring} ${info.color}`}>{info.short}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {p.projectTypes.slice(0, 2).map(pt => <span key={pt} className="text-[10px] bg-c-elevated text-c-text-4 px-2 py-0.5 rounded-full capitalize">{pt.replace(/-/g, ' ')}</span>)}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-c-text-3 font-semibold">{formatCurrency(p.totalValue)}</span>
                      <span className="text-c-text-4">{pct.toFixed(0)}% collected</span>
                    </div>
                    <div className="mt-1.5 h-1 rounded-full bg-c-border-inner"><div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} /></div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel — project detail */}
          <div className="flex-1 overflow-hidden">
            {selected ? <ProjectDetail key={selected.id} project={selected} /> : (
              <div className="flex items-center justify-center h-full text-c-text-4 text-sm">Select a project</div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
