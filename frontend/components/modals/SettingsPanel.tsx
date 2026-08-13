'use client';

import { useState } from 'react';
import { User } from '@/types';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { usersApi, authApi } from '@/lib/api';
import { X, Sun, Moon, Monitor, Lock, Bell, Smartphone, HelpCircle, LogOut } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface SettingsPanelProps {
  user: User;
}

const DEFAULT_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Abhinav',
  'https://api.dicebear.com/7.x/bottts/svg?seed=robot',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=pixel',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=lorelei',
  'https://api.dicebear.com/7.x/micah/svg?seed=micah',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=adventure'
];

export default function SettingsPanel({ user }: SettingsPanelProps) {
  const { setSettingsOpen, theme, setTheme, addToast } = useUIStore();
  const { updateUser, logout } = useAuthStore();
  const [editName, setEditName] = useState(user.display_name);
  const [editAbout, setEditAbout] = useState(user.about_status || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(user.avatar_url || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editName.trim()) {
      addToast({ message: 'Display name cannot be empty', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const res = await usersApi.updateMe({
        display_name: editName.trim(),
        about_status: editAbout.trim(),
        avatar_url: editAvatarUrl
      });
      updateUser(res.data);
      addToast({ message: 'Profile updated!', type: 'success' });
    } catch {
      addToast({ message: 'Failed to update profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    window.location.href = '/login';
  };

  const SectionHeader = ({ label }: { label: string }) => (
    <div className="section-header mt-4 first:mt-0">{label}</div>
  );

  const SettingRow = ({ icon: Icon, label, onClick, danger = false, value }: {
    icon: any; label: string; onClick?: () => void; danger?: boolean; value?: string;
  }) => (
    <button
      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors text-left"
      style={{ color: danger ? 'var(--danger)' : 'var(--text-primary)' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      onClick={onClick}
    >
      <Icon size={18} style={{ color: danger ? 'var(--danger)' : 'var(--text-muted)' }} />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {value && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{value}</span>}
    </button>
  );

  return (
    <div className="modal-overlay" onClick={() => setSettingsOpen(false)}>
      <div className="modal-content max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '400px' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Settings</h2>
          <button className="icon-btn" onClick={() => setSettingsOpen(false)} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-3 p-3 rounded-xl mb-3" style={{ background: 'var(--bg-input)' }}>
          {editAvatarUrl ? (
            <img src={editAvatarUrl} alt={editName} className="w-14 h-14 rounded-full object-cover border-2" style={{ borderColor: 'var(--accent)' }} />
          ) : (
            <div className="avatar-fallback w-14 h-14 text-base">{getInitials(editName)}</div>
          )}
          <div className="flex-1">
            <input className="signal-input text-sm mb-1.5" value={editName}
              onChange={(e) => setEditName(e.target.value)} placeholder="Display name" />
            <input className="signal-input text-xs" value={editAbout}
              onChange={(e) => setEditAbout(e.target.value)} placeholder="About..." />
          </div>
        </div>

        {/* Preset Avatar Selection */}
        <div className="mb-4 px-1">
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Choose Profile Avatar:</p>
          <div className="flex flex-wrap gap-2.5">
            {DEFAULT_AVATARS.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setEditAvatarUrl(url)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 transition-all hover:scale-105"
                style={{
                  borderColor: editAvatarUrl === url ? 'var(--accent)' : 'transparent',
                  boxShadow: editAvatarUrl === url ? '0 0 8px var(--accent)' : 'none',
                }}
              >
                <img src={url} alt={`avatar-${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <button className="btn-primary w-full mb-4 text-sm py-2" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>

        {/* Appearance */}
        <SectionHeader label="Appearance" />
        <div className="flex gap-2 px-4 mb-2">
          {([
            { value: 'light', icon: Sun, label: 'Light' },
            { value: 'dark', icon: Moon, label: 'Dark' },
            { value: 'system', icon: Monitor, label: 'System' },
          ] as const).map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-all"
              style={{
                background: theme === value ? 'var(--accent-light)' : 'var(--bg-input)',
                color: theme === value ? 'var(--accent)' : 'var(--text-muted)',
                border: `2px solid ${theme === value ? 'var(--accent)' : 'transparent'}`,
              }}
              onClick={() => setTheme(value)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Privacy & Notifications */}
        <SectionHeader label="Privacy & Security" />
        <SettingRow icon={Lock} label="Privacy" onClick={() => addToast({ message: 'Privacy settings — Coming Soon!', type: 'info' })} value="→" />
        <SettingRow icon={Bell} label="Notifications" onClick={() => addToast({ message: 'Notification settings — Coming Soon!', type: 'info' })} value="→" />

        {/* Coming Soon */}
        <SectionHeader label="Linked Devices" />
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--bg-input)', margin: '0 4px' }}>
          <Smartphone size={18} style={{ color: 'var(--text-muted)' }} />
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>This device</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Web browser · Active now</p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>Active</span>
        </div>
        <p className="text-xs text-center mt-2 mb-2" style={{ color: 'var(--text-muted)' }}>
          Multi-device sync — Coming Soon
        </p>

        {/* Help & Logout */}
        <SectionHeader label="More" />
        <SettingRow icon={HelpCircle} label="Help & Support" onClick={() => addToast({ message: 'Help — Coming Soon!', type: 'info' })} />
        <SettingRow icon={LogOut} label="Sign Out" onClick={handleLogout} danger />

        {/* Version */}
        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
          Signal Clone v1.0.0 · Made with 💙
        </p>
      </div>
    </div>
  );
}
