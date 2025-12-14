'use client';

import React from 'react';
import {
    Sparkles,
    LayoutDashboard,
    FolderOpen,
    Settings,
    LogOut,
    Plus,
    History,
    LucideIcon
} from 'lucide-react';

// --- Global Styles ---
export const GlobalStyles = () => (
    <style>{`
    :root {
      --bg-dark: #020617;
      --bg-card: #0f172a;
      --bg-surface: #1e293b;
      --accent-primary: #6366f1;
      --accent-hover: #4f46e5;
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --border-color: rgba(255, 255, 255, 0.05);
      --sidebar-width: 260px;
    }

    body {
      background-color: var(--bg-dark);
      color: var(--text-primary);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      overflow-x: hidden;
    }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: #475569; }

    .bg-grid-pattern {
      background-size: 50px 50px;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
      -webkit-mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
    }

    .glass-panel {
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
    }
    
    .dashboard-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border-color);
      backdrop-filter: blur(8px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .dashboard-card:hover {
      background: rgba(30, 41, 59, 0.4);
      border-color: rgba(99, 102, 241, 0.4);
      transform: translateY(-2px);
      box-shadow: 0 10px 40px -10px rgba(99, 102, 241, 0.1);
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-hover));
      color: white;
      font-weight: 500;
      transition: all 0.2s;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset, 0 4px 12px rgba(99, 102, 241, 0.2);
    }
    .btn-primary:hover { 
      transform: translateY(-1px);
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset, 0 6px 20px rgba(99, 102, 241, 0.3);
    }

    .animate-enter { animation: enter 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
    @keyframes enter { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `}</style>
);

export interface MenuItem {
    id: string;
    icon: LucideIcon;
    label: string;
}

// --- Sidebar Component ---
interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onLogout }) => {
    const menuItems: MenuItem[] = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'projects', icon: FolderOpen, label: 'Projects' },
        { id: 'history', icon: History, label: 'History' },
        { id: 'settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-[var(--sidebar-width)] bg-[#020617] border-r border-white/5 flex flex-col z-20 backdrop-blur-xl bg-opacity-80">
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10">
                    <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">SubtitleAI</span>
            </div>

            <div className="px-3 py-2">
                <button
                    onClick={() => onTabChange('upload')}
                    className="w-full flex items-center justify-center gap-2 btn-primary p-3 rounded-xl transition-all font-medium mb-8"
                >
                    <Plus className="w-5 h-5" />
                    <span>New Project</span>
                </button>

                <div className="space-y-1">
                    <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Menu</p>
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${activeTab === item.id
                                ? 'bg-slate-800/50 text-white font-medium shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset]'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                                }`}
                        >
                            <item.icon className={`w-4 h-4 transition-colors ${activeTab === item.id ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-300'}`} />
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-auto p-4 border-t border-white/5">
                <div className="bg-slate-900/40 rounded-xl p-4 mb-4 border border-white/5 ring-1 ring-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-300 font-medium">Free Plan</span>
                        <span className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer">Upgrade</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">75/100 minutes used</p>
                </div>

                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 px-2 text-slate-400 hover:text-white text-sm transition-colors w-full group"
                >
                    <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

// --- Topbar Component ---
import { Bell, Search, MoreVertical } from 'lucide-react';

export const Topbar: React.FC = () => (
    <header className="h-16 border-b border-white/5 bg-[#020617]/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
        <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96 hidden md:block group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                    type="text"
                    placeholder="Search projects..."
                    className="w-full bg-slate-900/50 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-900 transition-all placeholder:text-slate-600"
                />
            </div>
        </div>
        <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-[#020617]"></span>
            </button>
            <div className="h-8 w-px bg-white/5"></div>
            <div className="flex items-center gap-3 pl-2 cursor-pointer hover:bg-white/5 p-1 rounded-lg transition-colors group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-lg ring-2 ring-transparent group-hover:ring-indigo-500/20 transition-all">
                    JD
                </div>
                <div className="hidden md:block text-sm text-left">
                    <p className="font-medium text-slate-200 leading-none">John Doe</p>
                    <p className="text-slate-500 text-xs mt-0.5">Pro Workspace</p>
                </div>
                <MoreVertical className="w-4 h-4 text-slate-600 group-hover:text-slate-400 hidden md:block" />
            </div>
        </div>
    </header>
);
