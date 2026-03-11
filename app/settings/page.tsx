'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { useSettingsStore } from '@/store/settings';
import { useAuthStore } from '@/store/auth';
import { useQuotesStore } from '@/store/quotes';
import { useProjectsStore } from '@/store/projects';
import { seedSampleData } from '@/lib/storage';
import type { AppSettings } from '@/types';
import { CheckCircle2, Trash2, Database, LogOut, User } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { settings, init, update } = useSettingsStore();
  const { currentUser, logout } = useAuthStore();
  const { init: initQuotes } = useQuotesStore();
  const { init: initProjects } = useProjectsStore();
  const [form, setForm] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [dataAction, setDataAction] = useState<'idle' | 'cleared' | 'loaded'>('idle');

  const handleClearAllData = () => {
    if (!confirm('Clear all estimates and jobs? This cannot be undone.')) return;
    localStorage.removeItem('rnr:quotes');
    localStorage.removeItem('rnr:projects');
    initQuotes();
    initProjects();
    setDataAction('cleared');
    setTimeout(() => setDataAction('idle'), 2500);
  };

  const handleLoadSampleData = () => {
    seedSampleData(settings, true);
    initQuotes();
    initProjects();
    setDataAction('loaded');
    setTimeout(() => setDataAction('idle'), 2500);
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  useEffect(() => { init(); }, []);
  useEffect(() => { setForm(settings); }, [settings]);

  const setCompany = (patch: Partial<AppSettings['company']>) =>
    setForm(f => ({ ...f, company: { ...f.company, ...patch } }));
  const setSalesRep = (patch: Partial<AppSettings['salesRep']>) =>
    setForm(f => ({ ...f, salesRep: { ...f.salesRep, ...patch } }));
  const setPricing = (patch: Partial<AppSettings['pricing']>) =>
    setForm(f => ({ ...f, pricing: { ...f.pricing, ...patch } }));
  const setPresentation = (patch: Partial<AppSettings['presentation']>) =>
    setForm(f => ({ ...f, presentation: { ...f.presentation, ...patch } }));

  const handleSave = () => {
    update(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-c-text">Settings</h1>
            <p className="text-sm text-c-text-4 mt-0.5">Configure your company and pricing information</p>
          </div>
          <Button onClick={handleSave} className="gap-2">
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : 'Save Changes'}
          </Button>
        </div>

        <div className="space-y-6">
          {/* Profile & Logout */}
          <section className="bg-c-card border border-c-border-inner rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <User className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-base font-bold text-c-text">{currentUser?.name ?? 'User'}</div>
                  <div className="text-xs text-c-text-4 capitalize">{currentUser?.role ?? 'sales'}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 h-12 px-5 rounded-2xl text-sm font-semibold bg-red-500/8 border border-red-500/20 text-red-400 hover:bg-red-500/12 active:scale-[0.98] transition-all"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </div>
          </section>

          {/* Company */}
          <section className="bg-c-card border border-c-border-inner rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-c-text mb-4">Company Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input label="Company Name" value={form.company.name} onChange={e => setCompany({ name: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Input label="Tagline" value={form.company.tagline} onChange={e => setCompany({ tagline: e.target.value })} />
              </div>
              <Input label="Phone" value={form.company.phone} onChange={e => setCompany({ phone: e.target.value })} />
              <Input label="Email" type="email" value={form.company.email} onChange={e => setCompany({ email: e.target.value })} />
              <div className="col-span-2">
                <Input label="Address" value={form.company.address} onChange={e => setCompany({ address: e.target.value })} />
              </div>
              <Input label="Website" value={form.company.website} onChange={e => setCompany({ website: e.target.value })} />
              <Input label="License / Certifications" value={form.company.license} onChange={e => setCompany({ license: e.target.value })} />
            </div>
          </section>

          {/* Sales Rep */}
          <section className="bg-c-card border border-c-border-inner rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-c-text mb-4">Sales Representative</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Name" value={form.salesRep.name} onChange={e => setSalesRep({ name: e.target.value })} />
              <Input label="Title" value={form.salesRep.title} onChange={e => setSalesRep({ title: e.target.value })} />
              <Input label="Phone" value={form.salesRep.phone} onChange={e => setSalesRep({ phone: e.target.value })} />
              <Input label="Email" type="email" value={form.salesRep.email} onChange={e => setSalesRep({ email: e.target.value })} />
            </div>
          </section>

          {/* Pricing */}
          <section className="bg-c-card border border-c-border-inner rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-c-text mb-4">Pricing Defaults</h2>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Sales Tax Rate (%)"
                type="number"
                step="0.1"
                value={form.pricing.taxRate}
                onChange={e => setPricing({ taxRate: Number(e.target.value) })}
              />
              <Input
                label="Demo Rate ($/sf)"
                type="number"
                step="0.5"
                value={form.pricing.demolitionRate}
                onChange={e => setPricing({ demolitionRate: Number(e.target.value) })}
              />
              <Input
                label="Quote Valid (days)"
                type="number"
                value={form.pricing.quoteValidDays}
                onChange={e => setPricing({ quoteValidDays: Number(e.target.value) })}
              />
            </div>
          </section>

          {/* Financing */}
          <section className="bg-c-card border border-c-border-inner rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-c-text mb-4">Financing Options</h2>
            <div className="space-y-3">
              {form.financing.map((opt, i) => (
                <div key={opt.id} className="grid grid-cols-4 gap-3 items-end">
                  <Input
                    label={i === 0 ? 'Label' : undefined}
                    value={opt.label}
                    onChange={e => {
                      const f = [...form.financing];
                      f[i] = { ...f[i], label: e.target.value };
                      setForm(prev => ({ ...prev, financing: f }));
                    }}
                  />
                  <Input
                    label={i === 0 ? 'Months' : undefined}
                    type="number"
                    value={opt.termMonths}
                    onChange={e => {
                      const f = [...form.financing];
                      f[i] = { ...f[i], termMonths: Number(e.target.value) };
                      setForm(prev => ({ ...prev, financing: f }));
                    }}
                  />
                  <Input
                    label={i === 0 ? 'APR (%)' : undefined}
                    type="number"
                    step="0.1"
                    value={opt.apr}
                    onChange={e => {
                      const f = [...form.financing];
                      f[i] = { ...f[i], apr: Number(e.target.value) };
                      setForm(prev => ({ ...prev, financing: f }));
                    }}
                  />
                  <div className="text-xs text-c-text-4 pb-2">Option {i + 1}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Presentation */}
          <section className="bg-c-card border border-c-border-inner rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-c-text mb-4">Presentation Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-c-text">Show Financing Slide</div>
                  <div className="text-xs text-c-text-4">Include financing options in the client presentation</div>
                </div>
                <button
                  onClick={() => setPresentation({ showFinancing: !form.presentation.showFinancing })}
                  className={`w-14 h-8 rounded-full transition-colors cursor-pointer flex items-center px-1 ${form.presentation.showFinancing ? 'bg-amber-500' : 'bg-c-elevated'}`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white transition-transform ${form.presentation.showFinancing ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
              {form.presentation.customSlideText !== undefined && (
                <Textarea
                  label="Custom Slide Text"
                  rows={2}
                  value={form.presentation.customSlideText ?? ''}
                  onChange={e => setPresentation({ customSlideText: e.target.value })}
                />
              )}
            </div>
          </section>

          {/* Data Management */}
          <section className="bg-c-card border border-c-border-inner rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-c-text mb-1">Data Management</h2>
            <p className="text-xs text-c-text-4 mb-4">Reset the app or load sample data for demonstrations.</p>
            <div className="flex gap-3">
              <button
                onClick={handleLoadSampleData}
                className="flex items-center gap-2.5 h-12 px-5 rounded-2xl text-sm font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/15 active:scale-[0.98] transition-all"
              >
                <Database className="w-4 h-4" />
                {dataAction === 'loaded' ? 'Sample Data Loaded!' : 'Load Sample Data'}
              </button>
              <button
                onClick={handleClearAllData}
                className="flex items-center gap-2.5 h-12 px-5 rounded-2xl text-sm font-semibold bg-red-500/8 border border-red-500/20 text-red-400 hover:bg-red-500/12 active:scale-[0.98] transition-all"
              >
                <Trash2 className="w-4 h-4" />
                {dataAction === 'cleared' ? 'All Data Cleared!' : 'Clear All Data'}
              </button>
            </div>
          </section>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} size="lg" className="gap-2">
            {saved ? <><CheckCircle2 className="w-5 h-5" /> Saved!</> : 'Save Changes'}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
