'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuthStore } from '@/store/auth';
import type { AppUser, UserRole } from '@/types';
import { Users, Plus, Trash2, Edit2, Check, X, Shield, Briefcase, HardHat } from 'lucide-react';

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; icon: typeof Shield; desc: string }> = {
  admin:      { label: 'Admin',      color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',   icon: Shield,    desc: 'Full access — all quotes, projects, settings, pricing, and user management' },
  sales:      { label: 'Sales',      color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',     icon: Briefcase, desc: 'Create and present quotes, view dashboard' },
  production: { label: 'Production', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: HardHat,   desc: 'View all quotes (read-only), manage projects tab' },
};

function RoleBadge({ role }: { role: UserRole }) {
  const c = ROLE_CONFIG[role];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.bg} ${c.color}`}>
      <c.icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

function UserRow({ user, isCurrentUser, onDelete, onUpdate }: {
  user: AppUser;
  isCurrentUser: boolean;
  onDelete: () => void;
  onUpdate: (updates: Partial<Pick<AppUser, 'name' | 'pin' | 'role'>>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<UserRole>(user.role);
  const [pinError, setPinError] = useState('');

  const save = () => {
    const updates: Partial<Pick<AppUser, 'name' | 'pin' | 'role'>> = {};
    if (name.trim() && name.trim() !== user.name) updates.name = name.trim();
    if (pin) {
      if (!/^\d{4}$/.test(pin)) { setPinError('PIN must be exactly 4 digits'); return; }
      updates.pin = pin;
    }
    if (role !== user.role) updates.role = role;
    if (Object.keys(updates).length > 0) onUpdate(updates);
    setEditing(false);
    setPin('');
    setPinError('');
  };

  return (
    <div className="bg-c-card border border-c-border-inner rounded-xl overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-4">
        <div className="w-9 h-9 rounded-full bg-c-elevated flex items-center justify-center text-sm font-bold text-c-text-2 shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-c-text text-sm">{user.name}</span>
            {isCurrentUser && <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">You</span>}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <RoleBadge role={user.role} />
            <span className="text-[10px] text-neutral-600">PIN: ••••</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setEditing(!editing)}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-c-text hover:bg-c-elevated transition-all">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          {!isCurrentUser && (
            <button onClick={() => { if (confirm(`Remove ${user.name}?`)) onDelete(); }}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="border-t border-c-border-inner px-5 py-4 bg-c-surface space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-500 mb-1.5 block">Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-c-input border border-c-border-input rounded-lg px-3 py-2 text-sm text-c-text focus:outline-none focus:border-amber-500/50" />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1.5 block">New PIN (4 digits, leave blank to keep)</label>
              <input type="password" maxLength={4} value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setPinError(''); }}
                placeholder="••••"
                className="w-full bg-c-input border border-c-border-input rounded-lg px-3 py-2 text-sm text-c-text tracking-widest focus:outline-none focus:border-amber-500/50" />
              {pinError && <div className="text-[11px] text-red-400 mt-1">{pinError}</div>}
            </div>
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-2 block">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ROLE_CONFIG) as UserRole[]).map(r => {
                const c = ROLE_CONFIG[r];
                return (
                  <button key={r} onClick={() => setRole(r)}
                    className={`p-3 rounded-xl border text-left transition-all ${role === r ? `${c.bg} ${c.color}` : 'border-c-border-input text-neutral-500 hover:border-c-border-hover'}`}>
                    <c.icon className="w-3.5 h-3.5 mb-1" />
                    <div className="text-xs font-semibold">{c.label}</div>
                    <div className="text-[10px] opacity-70 mt-0.5 leading-tight">{c.desc.split('—')[0].trim()}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={save} className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-lg hover:bg-amber-400 transition-all">
              <Check className="w-3 h-3" /> Save
            </button>
            <button onClick={() => { setEditing(false); setName(user.name); setPin(''); setPinError(''); }}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-c-elevated text-neutral-400 text-xs rounded-lg hover:bg-c-surface transition-all">
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  const { users, currentUser, init, addUser, removeUser, updateUser } = useAuthStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('sales');
  const [addError, setAddError] = useState('');

  useEffect(() => { init(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = () => {
    setAddError('');
    if (!newName.trim()) { setAddError('Name is required'); return; }
    if (!/^\d{4}$/.test(newPin)) { setAddError('PIN must be exactly 4 digits'); return; }
    if (users.some(u => u.name.toLowerCase() === newName.trim().toLowerCase())) {
      setAddError('A user with that name already exists'); return;
    }
    addUser(newName.trim(), newPin, newRole);
    setNewName(''); setNewPin(''); setNewRole('sales'); setShowAdd(false);
  };

  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-c-text">User Management</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Manage team access and roles</p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black text-sm font-bold rounded-xl hover:bg-amber-400 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>

        {/* Role guide */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][]).map(([role, c]) => (
            <div key={role} className={`p-4 rounded-xl border ${c.bg}`}>
              <div className={`flex items-center gap-2 ${c.color} mb-2`}>
                <c.icon className="w-4 h-4" />
                <span className="text-sm font-semibold">{c.label}</span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>

        {/* Add user form */}
        {showAdd && (
          <div className="bg-c-card border border-c-border-inner rounded-xl p-5 mb-5 space-y-4">
            <div className="text-sm font-semibold text-c-text">New User</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-500 mb-1.5 block">Full Name</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Jake Rodriguez"
                  className="w-full bg-c-input border border-c-border-input rounded-lg px-3 py-2 text-sm text-c-text focus:outline-none focus:border-amber-500/50" />
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1.5 block">4-Digit PIN</label>
                <input type="password" maxLength={4} value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full bg-c-input border border-c-border-input rounded-lg px-3 py-2 text-sm text-c-text tracking-widest focus:outline-none focus:border-amber-500/50" />
              </div>
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-2 block">Role</label>
              <div className="flex gap-2">
                {(Object.keys(ROLE_CONFIG) as UserRole[]).map(r => {
                  const c = ROLE_CONFIG[r];
                  return (
                    <button key={r} onClick={() => setNewRole(r)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${newRole === r ? `${c.bg} ${c.color}` : 'border-c-border-input text-neutral-500 hover:border-c-border-hover'}`}>
                      <c.icon className="w-3 h-3" />
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {addError && <div className="text-xs text-red-400">{addError}</div>}
            <div className="flex gap-2">
              <button onClick={handleAdd} className="px-4 py-2 bg-amber-500 text-black text-xs font-bold rounded-lg hover:bg-amber-400 transition-all">Create User</button>
              <button onClick={() => { setShowAdd(false); setAddError(''); }} className="px-4 py-2 bg-c-elevated text-neutral-400 text-xs rounded-lg hover:bg-c-surface transition-all">Cancel</button>
            </div>
          </div>
        )}

        {/* Users list */}
        <div className="space-y-3">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-c-card border border-c-border-inner rounded-xl">
              <Users className="w-8 h-8 text-neutral-700 mb-3" />
              <div className="text-neutral-500 text-sm">No users yet</div>
            </div>
          ) : (
            users.map(u => (
              <UserRow
                key={u.id}
                user={u}
                isCurrentUser={u.id === currentUser?.id}
                onDelete={() => removeUser(u.id)}
                onUpdate={(updates) => updateUser(u.id, updates)}
              />
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
