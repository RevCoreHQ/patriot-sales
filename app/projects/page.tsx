'use client';

import { useEffect, useRef, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useProjectsStore } from '@/store/projects';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import type { Project, ProjectPhase, ProjectTodo, CloseoutItem, PaymentType, PaymentMethod } from '@/types';
import {
  Hammer, CheckCircle2, DollarSign, Truck, FileText, Calendar,
  Plus, X, ChevronDown, Link2, ClipboardList, ListTodo, Clock,
  Trash2, Check, CreditCard, Banknote, Camera, Sparkles, Lock,
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
  { value: 'cash',          label: 'Cash',        icon: '💵' },
  { value: 'check',         label: 'Check',       icon: '📝' },
  { value: 'credit-card',   label: 'Credit Card', icon: '💳' },
  { value: 'ach',           label: 'ACH / Bank',  icon: '🏦' },
  { value: 'zelle',         label: 'Zelle',       icon: '⚡' },
  { value: 'venmo',         label: 'Venmo',       icon: '💙' },
];

const PHASES: { id: ProjectPhase; label: string; short: string; color: string; ring: string }[] = [
  { id: 'design-review', label: 'Design Review', short: 'Design',     color: 'text-blue-400',    ring: 'border-blue-500/50 bg-blue-500/10' },
  { id: 'permitting',    label: 'Permitting',     short: 'Permit',     color: 'text-yellow-400',  ring: 'border-yellow-500/50 bg-yellow-500/10' },
  { id: 'site-prep',     label: 'Site Prep',      short: 'Prep',       color: 'text-orange-400',  ring: 'border-orange-500/50 bg-orange-500/10' },
  { id: 'installation',  label: 'Installation',   short: 'Install',    color: 'text-purple-400',  ring: 'border-purple-500/50 bg-purple-500/10' },
  { id: 'finishing',     label: 'Finishing',      short: 'Finish',     color: 'text-teal-400',    ring: 'border-teal-500/50 bg-teal-500/10' },
  { id: 'delivered',     label: 'Delivered',      short: 'Done',       color: 'text-emerald-400', ring: 'border-emerald-500/50 bg-emerald-500/10' },
];

function phaseIndex(id: ProjectPhase) { return PHASES.findIndex(p => p.id === id); }
function phaseInfo(id: ProjectPhase) { return PHASES[phaseIndex(id)] ?? PHASES[0]; }

// ── Date picker — native input with a calendar trigger ─────────────────────
function DatePickerInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="text-xs text-c-text-3 mb-1.5 block">{label}</label>
      <div className="relative">
        <input
          ref={ref}
          type="date"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-c-input border border-c-border-input rounded-lg pl-3 pr-9 py-2 text-sm text-c-text focus:outline-none focus:border-amber-500/60 text-c-text"
        />
        <button
          type="button"
          onClick={() => ref.current?.showPicker?.()}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-amber-400 transition-colors"
        >
          <Calendar className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Project card ─────────────────────────────────────────────────────────────
function ProjectCard({ project }: { project: Project }) {
  const {
    updatePhase, addUpdate, setDates, setCashCollected, setGhlContactId,
    addTodo, toggleTodo, removeTodo, toggleCloseout, addPayment, removePayment, remove,
  } = useProjectsStore();

  const [tab, setTab] = useState<'overview' | 'todos' | 'closeout' | 'finance' | 'notes' | 'photos'>('overview');
  const [noteText, setNoteText] = useState('');
  const [todoText, setTodoText] = useState('');
  const [editing, setEditing] = useState(false);
  const [estDate, setEstDate] = useState(project.estimatedCompletion?.slice(0, 10) ?? '');
  const [startDate, setStartDate] = useState(project.startDate?.slice(0, 10) ?? '');
  const [cash, setCash] = useState(String(project.cashCollected));
  const [ghlId, setGhlId] = useState(project.ghlContactId ?? '');
  // Finance form state
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

  const submitNote = () => {
    if (!noteText.trim()) return;
    addUpdate(project.id, project.phase, noteText.trim());
    setNoteText('');
  };

  const submitTodo = () => {
    if (!todoText.trim()) return;
    addTodo(project.id, todoText.trim());
    setTodoText('');
  };

  const saveEdits = () => {
    setDates(project.id, {
      startDate: startDate ? new Date(startDate + 'T12:00:00').toISOString() : undefined,
      estimatedCompletion: estDate ? new Date(estDate + 'T12:00:00').toISOString() : undefined,
    });
    // Only set cash manually if no payment transactions exist yet
    if (payments.length === 0) setCashCollected(project.id, Number(cash) || 0);
    if (ghlId !== project.ghlContactId) setGhlContactId(project.id, ghlId);
    setEditing(false);
  };

  const submitPayment = () => {
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) return;
    addPayment(project.id, amt, payType, payMethod, payNote);
    setPayAmount('');
    setPayNote('');
  };

  return (
    <div className="bg-c-card border border-c-border-inner rounded-2xl overflow-visible">
      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start gap-3 justify-between">
          <div className="min-w-0">
            <div className="font-bold text-c-text text-lg leading-tight">{project.clientName}</div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {project.projectTypes.map(pt => (
                <span key={pt} className="text-xs bg-c-elevated text-c-text-3 px-2.5 py-1 rounded-full capitalize">
                  {pt.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-lg font-bold text-c-text">{formatCurrency(project.totalValue)}</span>
            <span className={`text-sm font-medium px-3 py-1.5 rounded-full border ${info.ring} ${info.color}`}>
              {info.label}
            </span>
          </div>
        </div>

        {/* Phase pipeline — click to advance, no dropdown needed */}
        <div className="mt-4">
          <div className="flex items-center gap-0">
            {PHASES.map((p, i) => {
              const done = i < pi;
              const active = i === pi;
              const isLast = i === PHASES.length - 1;
              return (
                <div key={p.id} className="flex items-center flex-1">
                  <button
                    onClick={() => updatePhase(project.id, p.id)}
                    title={p.label}
                    className={`relative flex flex-col items-center group flex-1`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                      done ? 'bg-amber-500 border-amber-500' :
                      active ? 'bg-amber-500/30 border-amber-400 ring-2 ring-amber-500/20' :
                      'bg-transparent border-c-border-input group-hover:border-c-border-hover'
                    }`} />
                    <span className={`text-[11px] mt-1 font-medium whitespace-nowrap transition-colors ${
                      done ? 'text-amber-400' : active ? 'text-amber-300' : 'text-neutral-600 group-hover:text-neutral-400'
                    }`}>{p.short}</span>
                  </button>
                  {!isLast && (
                    <div className={`h-0.5 flex-1 mx-0.5 rounded transition-all ${done ? 'bg-amber-500' : 'bg-c-border-inner'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Metrics row ── */}
      <div className="px-5 pb-4 grid grid-cols-3 gap-3">
        <div className="bg-c-surface border border-c-border-inner rounded-xl p-3">
          <div className="text-xs text-neutral-500 mb-0.5">Cash Collected</div>
          <div className="text-base font-bold text-c-text">{formatCurrency(project.cashCollected)}</div>
          <div className="mt-1.5 h-1 rounded-full bg-c-border-inner">
            <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">{pct.toFixed(0)}% of total</div>
        </div>
        <div className="bg-c-surface border border-c-border-inner rounded-xl p-3">
          <div className="text-xs text-neutral-500 mb-0.5">Est. Completion</div>
          <div className="text-base font-bold text-c-text">
            {project.estimatedCompletion ? formatDateShort(project.estimatedCompletion) : '—'}
          </div>
          {project.startDate && (
            <div className="text-xs text-neutral-500 mt-0.5">Start: {formatDateShort(project.startDate)}</div>
          )}
          {project.actualCompletion && (
            <div className="text-xs text-emerald-400 mt-0.5">✓ {formatDateShort(project.actualCompletion)}</div>
          )}
        </div>
        <div className="bg-c-surface border border-c-border-inner rounded-xl p-3">
          <div className="text-xs text-neutral-500 mb-0.5">Closeout</div>
          <div className="text-base font-bold text-c-text">{closeoutDone}/{closeoutTotal}</div>
          <div className="mt-1.5 h-1 rounded-full bg-c-border-inner">
            <div className={`h-full rounded-full transition-all ${closeoutDone === closeoutTotal ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${closeoutTotal > 0 ? (closeoutDone / closeoutTotal) * 100 : 0}%` }} />
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">items complete</div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="px-5 pb-3 flex items-center gap-1 border-t border-c-border-inner pt-3">
        {([
          { key: 'overview', label: 'Overview', icon: Clock },
          { key: 'todos', label: `To-do${project.todos.length > 0 ? ` (${todoDone}/${project.todos.length})` : ''}`, icon: ListTodo },
          { key: 'closeout', label: 'Closeout', icon: ClipboardList },
          { key: 'finance', label: `Finance${payments.length > 0 ? ` (${payments.length})` : ''}`, icon: DollarSign },
          { key: 'notes', label: 'Notes', icon: FileText },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 h-11 px-4 rounded-xl text-sm font-medium transition-all ${
              tab === key ? 'bg-c-elevated text-c-text' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
        {/* Photo Log — coming soon */}
        <button
          onClick={() => setTab('photos')}
          className={`flex items-center gap-1.5 h-11 px-4 rounded-xl text-sm font-medium transition-all ${
            tab === 'photos' ? 'bg-purple-500/15 text-purple-400' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          Photos
          <span className="text-[10px] font-bold text-purple-400 bg-purple-500/15 border border-purple-500/20 px-1.5 py-0.5 rounded-full leading-none">
            NEW
          </span>
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setEditing(!editing)}
          className={`flex items-center gap-1.5 h-11 px-4 rounded-xl text-sm font-medium transition-all ${editing ? 'bg-amber-500/15 text-amber-400' : 'text-neutral-500 hover:text-neutral-300'}`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Edit
        </button>
        {project.phase !== 'delivered' && (
          <button
            onClick={() => {
              if (project.phase === 'finishing' && !canDeliver) {
                alert('Complete all closeout checklist items before marking as delivered.');
                setTab('closeout');
                return;
              }
              const idx = phaseIndex(project.phase);
              if (idx < PHASES.length - 1) updatePhase(project.id, PHASES[idx + 1].id);
            }}
            className="flex items-center gap-1.5 h-11 px-4 rounded-xl text-sm font-medium bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-all"
          >
            <ChevronDown className="w-3.5 h-3.5 rotate-[-90deg]" />
            Next Phase
          </button>
        )}
      </div>

      {/* ── Tab content ── */}

      {/* Edit details */}
      {editing && (
        <div className="mx-5 mb-4 bg-c-surface border border-c-border-inner rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <DatePickerInput label="Start Date" value={startDate} onChange={setStartDate} />
            <DatePickerInput label="Est. Completion" value={estDate} onChange={setEstDate} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {payments.length === 0 && (
              <div>
                <label className="text-xs text-c-text-3 mb-1.5 block">Cash Collected ($)</label>
                <input type="number" value={cash} onChange={e => setCash(e.target.value)} placeholder="0"
                  className="w-full bg-c-input border border-c-border-input rounded-lg px-3 py-2 text-sm text-c-text focus:outline-none focus:border-amber-500/60" />
              </div>
            )}
            <div className={payments.length === 0 ? '' : 'col-span-2'}>
              <label className="text-xs text-neutral-500 mb-1.5 flex items-center gap-1"><Link2 className="w-3 h-3" /> GHL Contact ID</label>
              <input type="text" value={ghlId} onChange={e => setGhlId(e.target.value)} placeholder="GHL contact ID"
                className="w-full bg-c-input border border-c-border-input rounded-lg px-3 py-2 text-sm text-c-text font-mono focus:outline-none focus:border-amber-500/60" />
            </div>
          </div>
          {payments.length > 0 && (
            <div className="text-[11px] text-neutral-600">Cash collected is tracked via the Finance tab.</div>
          )}
          <div className="flex gap-2">
            <button onClick={saveEdits} className="h-11 px-6 bg-amber-500 text-black text-sm font-bold rounded-xl hover:bg-amber-400 active:scale-[0.97] transition-all">Save</button>
            <button onClick={() => setEditing(false)} className="h-11 px-5 bg-c-elevated text-c-text-3 text-sm rounded-xl hover:bg-c-surface active:scale-[0.97] transition-all">Cancel</button>
          </div>
        </div>
      )}

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="px-5 pb-5">
          {project.updates.length === 0 ? (
            <div className="text-xs text-neutral-600 py-3">No updates yet.</div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {project.updates.map(u => (
                <div key={u.id} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs text-neutral-300">{u.note}</div>
                    <div className="text-[10px] text-neutral-600 mt-0.5">
                      {formatDateShort(u.date)} · <span className="capitalize">{u.phase.replace(/-/g, ' ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {project.phase !== 'delivered' && (
            <div className="flex gap-2 mt-3 border-t border-c-border-inner pt-3">
              <input
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitNote()}
                placeholder="Add a project update note..."
                className="flex-1 h-11 bg-c-surface border border-c-border-inner rounded-xl px-3 text-sm text-c-text placeholder:text-c-text-4 focus:outline-none focus:border-amber-500/50"
              />
              <button onClick={submitNote} className="h-11 px-5 bg-amber-500 text-black text-sm font-bold rounded-xl hover:bg-amber-400 active:scale-[0.97] transition-all">Post</button>
            </div>
          )}
        </div>
      )}

      {/* Todos tab */}
      {tab === 'todos' && (
        <div className="px-5 pb-5">
          {project.todos.length === 0 ? (
            <div className="text-xs text-neutral-600 py-2">No to-do items yet. Add tasks that need to be completed.</div>
          ) : (
            <div className="space-y-1.5 mb-3 max-h-52 overflow-y-auto">
              {project.todos.map((t: ProjectTodo) => (
                <div key={t.id} className="flex items-center gap-2.5 group">
                  <button
                    onClick={() => toggleTodo(project.id, t.id)}
                    className={`w-6 h-6 rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${
                      t.completed ? 'bg-emerald-500 border-emerald-500' : 'border-c-border-input hover:border-c-border-hover'
                    }`}
                  >
                    {t.completed && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <span className={`text-sm flex-1 ${t.completed ? 'line-through text-c-text-3' : 'text-c-text'}`}>{t.text}</span>
                  <button onClick={() => removeTodo(project.id, t.id)} className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:text-red-400 transition-all">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 border-t border-c-border-inner pt-3">
            <input
              value={todoText}
              onChange={e => setTodoText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitTodo()}
              placeholder="Add a task or item to complete..."
              className="flex-1 h-11 bg-c-surface border border-c-border-inner rounded-xl px-3 text-sm text-c-text placeholder:text-c-text-4 focus:outline-none focus:border-amber-500/50"
            />
            <button onClick={submitTodo} className="h-11 w-11 flex items-center justify-center bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 active:scale-[0.97] transition-all">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Closeout checklist tab */}
      {tab === 'closeout' && (
        <div className="px-5 pb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-neutral-500">
              Complete all items before delivering the project.
            </div>
            {closeoutDone === closeoutTotal && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All complete
              </span>
            )}
          </div>
          <div className="space-y-2">
            {project.closeoutChecklist.map((item: CloseoutItem) => (
              <button
                key={item.id}
                onClick={() => toggleCloseout(project.id, item.id)}
                className={`w-full flex items-center gap-3 text-left px-4 py-3.5 rounded-xl border transition-all group ${item.completed ? 'bg-emerald-500/[0.06] border-emerald-500/20' : 'bg-c-surface border-c-border-inner hover:border-c-border-hover'}`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                  item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-c-border-input group-hover:border-c-border-hover'
                }`}>
                  {item.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <span className={`text-sm font-medium transition-colors ${item.completed ? 'text-c-text-3 line-through' : 'text-c-text'}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
          {project.phase === 'finishing' && closeoutDone < closeoutTotal && (
            <div className="mt-3 p-3 bg-amber-500/8 border border-amber-500/20 rounded-xl text-xs text-amber-400/80">
              Complete all {closeoutTotal - closeoutDone} remaining items before marking this project as Delivered.
            </div>
          )}
          {canDeliver && (
            <button
              onClick={() => updatePhase(project.id, 'delivered')}
              className="mt-3 w-full h-14 bg-emerald-500 text-white text-base font-bold rounded-xl hover:bg-emerald-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark Project Delivered
            </button>
          )}
        </div>
      )}

      {/* Finance tab */}
      {tab === 'finance' && (
        <div className="px-5 pb-5">
          {/* Record Payment form */}
          <div className="bg-c-surface border border-c-border-inner rounded-xl p-4 mb-4">
            <div className="text-xs font-semibold text-neutral-400 mb-3 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              Record Payment
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] text-neutral-500 mb-1.5 block">Amount ($)</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitPayment()}
                  placeholder="0.00"
                  className="w-full h-11 bg-c-input border border-c-border-input rounded-xl px-3 text-sm text-c-text focus:outline-none focus:border-amber-500/60"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 mb-1.5 block">Payment For</label>
                <select
                  value={payType}
                  onChange={e => setPayType(e.target.value as PaymentType)}
                  className="w-full h-11 bg-c-input border border-c-border-input rounded-xl px-3 text-sm text-c-text focus:outline-none focus:border-amber-500/60"
                >
                  {PAYMENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="text-[10px] text-neutral-500 mb-1.5 block">Payment Method</label>
              <div className="grid grid-cols-3 gap-1.5">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setPayMethod(m.value)}
                    className={`flex items-center gap-1.5 h-11 px-3 rounded-xl text-xs font-medium transition-all border ${
                      payMethod === m.value
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        : 'bg-c-input border-c-border-input text-c-text-3 hover:border-c-border-hover'
                    }`}
                  >
                    <span>{m.icon}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <label className="text-[10px] text-neutral-500 mb-1.5 block">Note (optional)</label>
              <input
                type="text"
                value={payNote}
                onChange={e => setPayNote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitPayment()}
                placeholder="e.g. check #1042, partial deposit..."
                className="w-full h-11 bg-c-input border border-c-border-input rounded-xl px-3 text-sm text-c-text placeholder:text-c-text-4 focus:outline-none focus:border-amber-500/60"
              />
            </div>
            <button
              onClick={submitPayment}
              disabled={!payAmount || parseFloat(payAmount) <= 0}
              className="w-full h-14 bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-black text-base font-bold rounded-xl hover:bg-amber-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Banknote className="w-4 h-4" />
              Record Payment
            </button>
          </div>

          {/* Transaction log */}
          {payments.length === 0 ? (
            <div className="text-xs text-neutral-600 py-2 text-center">No payments recorded yet.</div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Transaction History</div>
                <div className="text-sm font-bold text-emerald-400">
                  Total: {formatCurrency(payments.reduce((s, p) => s + p.amount, 0))}
                </div>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {[...payments].reverse().map(tx => {
                  const typeLabel = PAYMENT_TYPES.find(t => t.value === tx.type)?.label ?? tx.type;
                  const methodInfo = PAYMENT_METHODS.find(m => m.value === tx.method);
                  return (
                    <div key={tx.id} className="flex items-center gap-3 bg-c-surface border border-c-border-inner rounded-xl px-3 py-2.5 group">
                      <div className="text-base shrink-0">{methodInfo?.icon ?? '💰'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-c-text">{formatCurrency(tx.amount)}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium">{typeLabel}</span>
                          <span className="text-xs text-neutral-500">{methodInfo?.label}</span>
                        </div>
                        {tx.note && <div className="text-xs text-neutral-500 mt-0.5 truncate">{tx.note}</div>}
                        <div className="text-xs text-neutral-600 mt-0.5">{formatDateShort(tx.date)}</div>
                      </div>
                      <button
                        onClick={() => { if (confirm('Remove this payment?')) removePayment(project.id, tx.id); }}
                        className="w-9 h-9 flex items-center justify-center text-neutral-600 hover:text-red-400 transition-all shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Photos tab — coming soon */}
      {tab === 'photos' && (
        <div className="px-5 pb-5">
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center">
                  <Camera className="w-4.5 h-4.5 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-c-text">Photo Log</span>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-purple-400 bg-purple-500/15 border border-purple-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      <Sparkles className="w-2.5 h-2.5" />
                      Coming Soon
                    </span>
                  </div>
                  <div className="text-xs text-c-text-4 mt-0.5">Document your project from start to finish</div>
                </div>
              </div>
              <Lock className="w-4 h-4 text-purple-400/40 mt-1" />
            </div>

            {/* Wireframe preview */}
            <div className="mx-5 mb-5 rounded-xl border border-purple-500/15 bg-purple-500/5 p-4">
              <div className="text-[10px] font-semibold text-purple-400/60 uppercase tracking-wider mb-3">Preview</div>
              {/* Phase photo grid mockup */}
              {['Site Prep', 'Installation', 'Finishing'].map((phase, pi) => (
                <div key={phase} className="mb-4 last:mb-0">
                  <div className="text-[10px] font-semibold text-purple-300/50 mb-2 flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${pi === 0 ? 'bg-orange-400/40' : pi === 1 ? 'bg-purple-400/40' : 'bg-teal-400/40'}`} />
                    {phase}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {Array.from({ length: pi === 0 ? 3 : pi === 1 ? 4 : 2 }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-lg bg-purple-500/8 border border-purple-500/10 flex items-center justify-center"
                      >
                        <Camera className="w-3.5 h-3.5 text-purple-400/20" />
                      </div>
                    ))}
                    <div className="aspect-square rounded-lg border border-dashed border-purple-500/15 flex items-center justify-center">
                      <Plus className="w-3 h-3 text-purple-400/20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Features list */}
            <div className="px-5 pb-5 space-y-2">
              {[
                'Before & after photo comparisons per phase',
                'Auto-organized by project phase',
                'Share photo report with clients',
                'Before & after slider for presentations',
              ].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-purple-300/50">
                  <div className="w-3.5 h-3.5 rounded-full border border-purple-500/20 flex items-center justify-center shrink-0">
                    <div className="w-1 h-1 rounded-full bg-purple-400/30" />
                  </div>
                  {f}
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-purple-500/10 text-[10px] text-purple-400/40 font-medium">
                Launching in the next update · Stay tuned 🎉
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes tab */}
      {tab === 'notes' && (
        <div className="px-5 pb-5 text-xs text-neutral-500">
          {project.updates.length === 0 ? (
            <div className="py-3">No notes logged yet.</div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {project.updates.map(u => (
                <div key={u.id} className="bg-c-surface border border-c-border-inner rounded-xl px-4 py-3">
                  <div className="text-sm text-c-text-2 mb-1">{u.note}</div>
                  <div className="text-[10px] text-neutral-600">
                    {formatDateShort(u.date)} · <span className="capitalize">{u.phase.replace(/-/g, ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delivered banner */}
      {project.phase === 'delivered' && (
        <div className="mx-5 mb-5 flex items-center gap-3 px-4 py-3 bg-emerald-500/8 border border-emerald-500/25 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-sm text-emerald-400 font-medium">
            Project delivered{project.actualCompletion ? ` on ${formatDateShort(project.actualCompletion)}` : ''} 🎉
          </div>
          <button
            onClick={() => { if (confirm('Remove this project?')) remove(project.id); }}
            className="ml-auto w-9 h-9 flex items-center justify-center text-neutral-600 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const { projects, init } = useProjectsStore();
  const [filter, setFilter] = useState<ProjectPhase | 'all'>('all');

  useEffect(() => { init(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = filter === 'all' ? projects : projects.filter(p => p.phase === filter);

  const stats = {
    active: projects.filter(p => p.phase !== 'delivered').length,
    delivered: projects.filter(p => p.phase === 'delivered').length,
    revenue: projects.reduce((s, p) => s + p.totalValue, 0),
    collected: projects.reduce((s, p) => s + p.cashCollected, 0),
  };

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-c-text">Active Projects</h1>
          <p className="text-sm text-neutral-500 mt-1">Track accepted quotes through delivery</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Active Projects', value: stats.active, icon: Hammer, color: 'text-amber-400' },
            { label: 'Delivered', value: stats.delivered, icon: CheckCircle2, color: 'text-emerald-400' },
            { label: 'Total Project Value', value: formatCurrency(stats.revenue), icon: DollarSign, color: 'text-blue-400' },
            { label: 'Cash Collected', value: formatCurrency(stats.collected), icon: Truck, color: 'text-purple-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-c-surface border border-c-border-inner rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm text-neutral-500">{label}</span>
              </div>
              <div className="text-2xl font-bold text-c-text">{value}</div>
            </div>
          ))}
        </div>

        {/* Phase filter */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <button onClick={() => setFilter('all')}
            className={`h-11 px-5 text-sm font-medium rounded-xl transition-all ${filter === 'all' ? 'bg-c-elevated text-c-text' : 'text-neutral-500 hover:text-neutral-300'}`}>
            All ({projects.length})
          </button>
          {PHASES.map(p => {
            const count = projects.filter(proj => proj.phase === p.id).length;
            return (
              <button key={p.id} onClick={() => setFilter(p.id)}
                className={`h-11 px-5 text-sm font-medium rounded-xl transition-all ${filter === p.id ? 'bg-c-elevated text-c-text' : 'text-neutral-500 hover:text-neutral-300'}`}>
                {p.label} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        {/* Projects list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-c-card border border-c-border-inner rounded-2xl">
            <Hammer className="w-10 h-10 text-neutral-700 mb-3" />
            <div className="text-neutral-500 text-sm mb-1">
              {filter === 'all' ? 'No projects yet' : `No projects in ${PHASES.find(p => p.id === filter)?.label}`}
            </div>
            <div className="text-neutral-600 text-xs max-w-xs">
              Go to an accepted quote and click &quot;Move to Projects&quot; to start tracking it here.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}

        {projects.length === 0 && (
          <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-3">
            <FileText className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-xs text-neutral-400">
              <span className="text-amber-400 font-medium">Tip:</span> Open a quote, mark it as Accepted, then click &quot;Move to Projects&quot; to begin tracking.
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
