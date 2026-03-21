'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { useSettingsStore } from '@/store/settings';
import { useQuotesStore } from '@/store/quotes';
import { useProjectsStore } from '@/store/projects';
import { seedSampleData } from '@/lib/storage';
import type { AppSettings, TeamMember, TeamRole } from '@/types';
import { requestPermission, sendNotification } from '@/lib/notifications';
import { generateId } from '@/lib/utils';
import { CheckCircle2, Trash2, Database, Bell, Smartphone, Plus, X, UsersRound, Sun, Moon } from 'lucide-react';

const ROLE_LABELS: Record<TeamRole, string> = { admin: 'Admin', closer: 'Closer', setter: 'Setter' };

export default function SettingsPage() {
  const { settings, init, update } = useSettingsStore();
  const { init: initQuotes } = useQuotesStore();
  const { init: initProjects } = useProjectsStore();
  const [form, setForm] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [dataAction, setDataAction] = useState<'idle' | 'cleared' | 'loaded'>('idle');
  const [isStandalone, setIsStandalone] = useState(false);
  const [notifStatus, setNotifStatus] = useState<'idle' | 'sent' | 'denied'>('idle');

  const handleClearAllData = () => {
    if (!confirm('Clear all estimates and jobs? This cannot be undone.')) return;
    localStorage.removeItem('patriot:quotes');
    localStorage.removeItem('patriot:projects');
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

  useEffect(() => { init(); }, []);
  useEffect(() => { setForm(settings); }, [settings]);
  // Apply theme live as user toggles
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', form.theme);
  }, [form.theme]);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as Record<string, unknown>).standalone === true);
    }
  }, []);

  const setCompany = (patch: Partial<AppSettings['company']>) =>
    setForm(f => ({ ...f, company: { ...f.company, ...patch } }));
  const setSalesRep = (patch: Partial<AppSettings['salesRep']>) =>
    setForm(f => ({ ...f, salesRep: { ...f.salesRep, ...patch } }));
  const setPricing = (patch: Partial<AppSettings['pricing']>) =>
    setForm(f => ({ ...f, pricing: { ...f.pricing, ...patch } }));
  const setPresentation = (patch: Partial<AppSettings['presentation']>) =>
    setForm(f => ({ ...f, presentation: { ...f.presentation, ...patch } }));
  const setNotifications = (patch: Partial<AppSettings['notifications']>) =>
    setForm(f => ({ ...f, notifications: { ...f.notifications, ...patch } }));
  const setReminders = (patch: Partial<AppSettings['notifications']['reminders']>) =>
    setForm(f => ({ ...f, notifications: { ...f.notifications, reminders: { ...f.notifications.reminders, ...patch } } }));

  const updateTeamMember = (id: string, patch: Partial<TeamMember>) =>
    setForm(f => ({ ...f, team: f.team.map(m => m.id === id ? { ...m, ...patch } : m) }));
  const addTeamMember = () =>
    setForm(f => ({ ...f, team: [...f.team, { id: generateId(), name: '', role: 'setter' as TeamRole }] }));
  const removeTeamMember = (id: string) =>
    setForm(f => ({ ...f, team: f.team.filter(m => m.id !== id) }));

  const handleTestNotification = async () => {
    const granted = await requestPermission();
    if (granted) {
      sendNotification('Patriot Sales', 'Notifications are working! You\'ll get reminders for follow-ups and expiring quotes.');
      setNotifStatus('sent');
    } else {
      setNotifStatus('denied');
    }
    setTimeout(() => setNotifStatus('idle'), 3000);
  };

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
          {/* Appearance */}
          <section className="bg-c-card border border-c-border-inner rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-c-text mb-4">Appearance</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-c-text">Theme</div>
                <div className="text-xs text-c-text-4">Switch between light and dark mode</div>
              </div>
              <div className="flex items-center bg-c-elevated rounded-xl p-1 gap-1">
                <button
                  onClick={() => setForm(f => ({ ...f, theme: 'light' }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${form.theme === 'light' ? 'bg-c-card text-c-text shadow-sm' : 'text-c-text-3 hover:text-c-text-2'}`}
                >
                  <Sun className="w-4 h-4" /> Light
                </button>
                <button
                  onClick={() => setForm(f => ({ ...f, theme: 'dark' }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${form.theme === 'dark' ? 'bg-c-card text-c-text shadow-sm' : 'text-c-text-3 hover:text-c-text-2'}`}
                >
                  <Moon className="w-4 h-4" /> Dark
                </button>
              </div>
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

          {/* Team */}
          <section className="bg-c-card border border-c-border-inner rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-c-text flex items-center gap-2">
                <UsersRound className="w-4 h-4 text-[#C62828]" /> Team Members
              </h2>
              <button
                onClick={addTeamMember}
                className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold bg-[#C62828]/10 border border-[#C62828]/25 text-[#C62828] hover:bg-[#C62828]/15 active:scale-[0.98] transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="space-y-3">
              {form.team.map((member, i) => (
                <div key={member.id} className="grid grid-cols-[1fr_120px_1fr_1fr_32px] gap-3 items-end">
                  <Input
                    label={i === 0 ? 'Name' : undefined}
                    value={member.name}
                    onChange={e => updateTeamMember(member.id, { name: e.target.value })}
                  />
                  <div>
                    {i === 0 && <label className="block text-xs font-medium text-c-text-3 mb-1.5">Role</label>}
                    <select
                      value={member.role}
                      onChange={e => updateTeamMember(member.id, { role: e.target.value as TeamRole })}
                      className="w-full h-12 px-3 rounded-xl bg-c-elevated border border-c-border-inner text-sm text-c-text appearance-none cursor-pointer"
                    >
                      {Object.entries(ROLE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label={i === 0 ? 'Phone' : undefined}
                    value={member.phone ?? ''}
                    onChange={e => updateTeamMember(member.id, { phone: e.target.value })}
                  />
                  <Input
                    label={i === 0 ? 'Email' : undefined}
                    value={member.email ?? ''}
                    onChange={e => updateTeamMember(member.id, { email: e.target.value })}
                  />
                  <button
                    onClick={() => removeTeamMember(member.id)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all ${i === 0 ? 'mt-6' : ''}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {form.team.length === 0 && (
                <p className="text-xs text-c-text-4 py-2">No team members yet. Add your sales reps to track performance.</p>
              )}
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
                label="Tear-Off Rate ($/sf)"
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
                  className={`w-14 h-8 rounded-full transition-colors cursor-pointer flex items-center px-1 ${form.presentation.showFinancing ? 'bg-[#C62828]' : 'bg-c-elevated'}`}
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

          {/* Notifications */}
          <section className="bg-c-card border border-c-border-inner rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-c-text mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#C62828]" /> Notifications
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-c-text">Enable Reminders</div>
                  <div className="text-xs text-c-text-4">Get notified about follow-ups and expiring quotes</div>
                </div>
                <button
                  onClick={() => setNotifications({ enabled: !form.notifications.enabled })}
                  className={`w-14 h-8 rounded-full transition-colors cursor-pointer flex items-center px-1 ${form.notifications.enabled ? 'bg-[#C62828]' : 'bg-c-elevated'}`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white transition-transform ${form.notifications.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
              {form.notifications.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Follow-up after (days)"
                      type="number"
                      min={1}
                      value={form.notifications.reminders.followUpDays}
                      onChange={e => setReminders({ followUpDays: Number(e.target.value) })}
                    />
                    <Input
                      label="Expiry warning (days before)"
                      type="number"
                      min={1}
                      value={form.notifications.reminders.quoteExpiryDays}
                      onChange={e => setReminders({ quoteExpiryDays: Number(e.target.value) })}
                    />
                  </div>
                  <button
                    onClick={handleTestNotification}
                    className="flex items-center gap-2.5 h-10 px-4 rounded-xl text-sm font-medium bg-[#C62828]/10 border border-[#C62828]/25 text-[#C62828] hover:bg-[#C62828]/15 active:scale-[0.98] transition-all"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    {notifStatus === 'sent' ? 'Notification Sent!' : notifStatus === 'denied' ? 'Permission Denied' : 'Test Notification'}
                  </button>
                </>
              )}
            </div>
          </section>

          {/* Install App */}
          <section className="bg-c-card border border-c-border-inner rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-c-text mb-4 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#C62828]" /> Install App
            </h2>
            {isStandalone ? (
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                App is installed and running in standalone mode
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-c-text-3">Install Patriot Sales on your device for fullscreen access and faster loading.</p>
                <div className="bg-c-elevated rounded-xl p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#C62828]/15 text-[#C62828] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                    <p className="text-sm text-c-text-3">Tap the <strong className="text-c-text">Share</strong> button in Safari (square with arrow)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#C62828]/15 text-[#C62828] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                    <p className="text-sm text-c-text-3">Scroll down and tap <strong className="text-c-text">Add to Home Screen</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#C62828]/15 text-[#C62828] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                    <p className="text-sm text-c-text-3">Tap <strong className="text-c-text">Add</strong> to install</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Data Management */}
          <section className="bg-c-card border border-c-border-inner rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-c-text mb-1">Data Management</h2>
            <p className="text-xs text-c-text-4 mb-4">Reset the app or load sample data for demonstrations.</p>
            <div className="flex gap-3">
              <button
                onClick={handleLoadSampleData}
                className="flex items-center gap-2.5 h-12 px-5 rounded-2xl text-sm font-semibold bg-[#C62828]/10 border border-[#C62828]/25 text-[#C62828] hover:bg-[#C62828]/15 active:scale-[0.98] transition-all"
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
