'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
    User, Settings, Bell, Shield, CreditCard, Palette, Globe, KeyRound,
    Mail, Camera, Loader2, Check, AlertTriangle, Sparkles, LogOut, Trash2,
    Download, HardDrive
} from 'lucide-react';
import { GlobalStyles, Sidebar, Topbar } from '@/components/shared';

type TabId = 'profile' | 'notifications' | 'preferences' | 'billing' | 'security';

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'preferences', label: 'Preferences', icon: <Palette className="w-4 h-4" /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
];

export default function SettingsPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [activeTab, setActiveTab] = useState<TabId>('profile');
    const [loading, setLoading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [profile, setProfile] = useState({ name: '', email: '', plan: 'free' });
    const [notifications, setNotifications] = useState({
        emailNotifications: true, exportComplete: true, weeklyDigest: false, productUpdates: true,
    });
    const [preferences, setPreferences] = useState({
        defaultLanguage: 'en', defaultSubtitleStyle: 'default', autoGenerateSubtitles: true,
    });

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
        if (session?.user) {
            setProfile(prev => ({ ...prev, name: session.user.name || '', email: session.user.email || '' }));
        }
    }, [session, status, router]);

    const handleSave = async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    const handleLogout = async () => await signOut({ callbackUrl: '/login' });

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
        <button onClick={onChange} className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-indigo-600' : 'bg-slate-700'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
    );

    return (
        <>
            <GlobalStyles />
            <div className="min-h-screen bg-[#020617] text-white flex">
                <Sidebar activeTab="settings" onTabChange={(tab) => router.push(`/${tab}`)} />
                <div className="flex-1 flex flex-col min-h-screen">
                    <Topbar userName={session?.user?.name || 'User'} onLogout={handleLogout} />
                    <main className="flex-1 p-6 lg:p-10 overflow-auto">
                        <div className="max-w-4xl mx-auto">
                            <div className="mb-8">
                                <h1 className="text-3xl font-bold mb-2">Settings</h1>
                                <p className="text-slate-400">Manage your account and preferences</p>
                            </div>

                            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                                {tabs.map((tab) => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800'
                                            }`}>
                                        {tab.icon}{tab.label}
                                    </button>
                                ))}
                            </div>

                            {activeTab === 'profile' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-6 p-6 bg-slate-900/50 rounded-xl border border-slate-800">
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-bold">
                                                {profile.name ? profile.name[0].toUpperCase() : 'U'}
                                            </div>
                                            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                                                <Camera className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold">{profile.name || 'Your Name'}</h3>
                                            <p className="text-slate-400 text-sm">{profile.email}</p>
                                            <span className="mt-2 inline-block px-2 py-0.5 rounded-full text-xs bg-slate-700/50 text-slate-400 border border-slate-700">
                                                {profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)} Plan
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                                            <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                                            <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500" />
                                        </div>
                                    </div>
                                    <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3"><HardDrive className="w-5 h-5 text-slate-400" /><span>Storage Usage</span></div>
                                            <span className="text-sm text-slate-400">2.4 GB / 5 GB</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: '48%' }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800 space-y-4">
                                    {Object.entries(notifications).map(([key, val]) => (
                                        <div key={key} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                            <Toggle enabled={val} onChange={() => setNotifications({ ...notifications, [key]: !val })} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'preferences' && (
                                <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800 space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Default Language</label>
                                        <select value={preferences.defaultLanguage} onChange={(e) => setPreferences({ ...preferences, defaultLanguage: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg">
                                            <option value="en">English</option><option value="es">Spanish</option><option value="fr">French</option>
                                            <option value="de">German</option><option value="hi">Hindi</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                                        <div><p className="font-medium">Auto-generate subtitles</p><p className="text-sm text-slate-400">Generate on upload</p></div>
                                        <Toggle enabled={preferences.autoGenerateSubtitles} onChange={() => setPreferences({ ...preferences, autoGenerateSubtitles: !preferences.autoGenerateSubtitles })} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'billing' && (
                                <div className="space-y-6">
                                    <div className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/30">
                                        <p className="text-sm text-indigo-300">Current Plan</p>
                                        <h3 className="text-2xl font-bold capitalize">{profile.plan}</h3>
                                        <button onClick={() => router.push('/pricing')} className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold">
                                            {profile.plan === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800 space-y-4">
                                        <h3 className="font-semibold flex items-center gap-2"><KeyRound className="w-4 h-4 text-indigo-400" />Change Password</h3>
                                        <input type="password" placeholder="Current Password" className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg" />
                                        <input type="password" placeholder="New Password" className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg" />
                                        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold">Update Password</button>
                                    </div>
                                    <div className="p-6 bg-red-500/5 rounded-xl border border-red-500/20">
                                        <h3 className="font-semibold text-red-400 mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Danger Zone</h3>
                                        <div className="flex items-center justify-between">
                                            <div><p className="font-medium">Delete Account</p><p className="text-sm text-slate-400">Permanently delete your account</p></div>
                                            <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400 flex items-center gap-2">
                                                <Trash2 className="w-4 h-4" />Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-4 pt-6 mt-8 border-t border-slate-800">
                                {saveSuccess && <div className="flex items-center gap-2 text-emerald-400 text-sm"><Check className="w-4 h-4" />Saved</div>}
                                <button onClick={handleSave} disabled={loading}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2">
                                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
