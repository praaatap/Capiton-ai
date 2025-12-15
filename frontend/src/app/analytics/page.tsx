'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
    BarChart3, TrendingUp, Clock, FileVideo, Languages, Download, Eye,
    Calendar, ArrowUp, ArrowDown, Loader2, Sparkles, Play
} from 'lucide-react';
import { GlobalStyles, Sidebar, Topbar } from '@/components/shared';

interface StatCard {
    title: string;
    value: string | number;
    change: number;
    icon: React.ReactNode;
    color: string;
}

interface ChartData {
    label: string;
    value: number;
}

export default function AnalyticsPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
        setTimeout(() => setLoading(false), 1000);
    }, [status, router]);

    const handleLogout = async () => await signOut({ callbackUrl: '/login' });

    const stats: StatCard[] = [
        { title: 'Total Videos', value: 24, change: 12, icon: <FileVideo className="w-5 h-5" />, color: 'indigo' },
        { title: 'Minutes Processed', value: '147', change: 8, icon: <Clock className="w-5 h-5" />, color: 'purple' },
        { title: 'Subtitles Generated', value: 1842, change: 23, icon: <Languages className="w-5 h-5" />, color: 'emerald' },
        { title: 'Total Exports', value: 89, change: -5, icon: <Download className="w-5 h-5" />, color: 'amber' },
    ];

    const videoViews: ChartData[] = [
        { label: 'Mon', value: 45 }, { label: 'Tue', value: 62 }, { label: 'Wed', value: 38 },
        { label: 'Thu', value: 75 }, { label: 'Fri', value: 89 }, { label: 'Sat', value: 54 }, { label: 'Sun', value: 67 }
    ];

    const languageStats = [
        { name: 'English', count: 45, percentage: 45 },
        { name: 'Spanish', count: 22, percentage: 22 },
        { name: 'Hindi', count: 18, percentage: 18 },
        { name: 'French', count: 10, percentage: 10 },
        { name: 'German', count: 5, percentage: 5 },
    ];

    const recentExports = [
        { name: 'Marketing_Video_Final.mp4', date: '2 hours ago', duration: '3:45', size: '45 MB' },
        { name: 'Product_Demo_v2.mp4', date: '5 hours ago', duration: '8:22', size: '128 MB' },
        { name: 'Tutorial_Basics.mp4', date: 'Yesterday', duration: '12:15', size: '186 MB' },
        { name: 'Interview_Cut.mp4', date: '2 days ago', duration: '15:30', size: '245 MB' },
    ];

    const maxValue = Math.max(...videoViews.map(d => d.value));

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <>
            <GlobalStyles />
            <div className="min-h-screen bg-[#020617] text-white flex">
                <Sidebar activeTab="analytics" onTabChange={(tab) => router.push(`/${tab}`)} />
                <div className="flex-1 flex flex-col min-h-screen">
                    <Topbar userName={session?.user?.name || 'User'} onLogout={handleLogout} />

                    <main className="flex-1 p-6 lg:p-10 overflow-auto">
                        <div className="max-w-7xl mx-auto">
                            {/* Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Analytics</h1>
                                    <p className="text-slate-400">Track your video performance and usage</p>
                                </div>
                                <div className="flex gap-2">
                                    {(['7d', '30d', '90d'] as const).map((range) => (
                                        <button key={range} onClick={() => setTimeRange(range)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === range ? 'bg-indigo-600 text-white' : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800'
                                                }`}>
                                            {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                {stats.map((stat, i) => (
                                    <div key={i} className="p-6 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${stat.color}-500/10`}>
                                                <div className={`text-${stat.color}-400`}>{stat.icon}</div>
                                            </div>
                                            <div className={`flex items-center gap-1 text-sm ${stat.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {stat.change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                                {Math.abs(stat.change)}%
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                                        <p className="text-sm text-slate-400">{stat.title}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                {/* Activity Chart */}
                                <div className="lg:col-span-2 p-6 bg-slate-900/50 rounded-xl border border-slate-800">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold">Processing Activity</h3>
                                        <BarChart3 className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div className="flex items-end justify-between h-48 gap-2">
                                        {videoViews.map((data, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                                <div className="w-full bg-slate-800 rounded-t-lg relative overflow-hidden"
                                                    style={{ height: `${(data.value / maxValue) * 100}%` }}>
                                                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-600 to-purple-500 opacity-80" />
                                                </div>
                                                <span className="text-xs text-slate-500">{data.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Language Distribution */}
                                <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold">Languages</h3>
                                        <Languages className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div className="space-y-4">
                                        {languageStats.map((lang, i) => (
                                            <div key={i}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm">{lang.name}</span>
                                                    <span className="text-sm text-slate-400">{lang.count}</span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                                        style={{ width: `${lang.percentage}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Recent Exports */}
                            <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold">Recent Exports</h3>
                                    <button className="text-sm text-indigo-400 hover:text-indigo-300">View all</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left text-sm text-slate-400 border-b border-slate-800">
                                                <th className="pb-4 font-medium">File Name</th>
                                                <th className="pb-4 font-medium">Duration</th>
                                                <th className="pb-4 font-medium">Size</th>
                                                <th className="pb-4 font-medium">Exported</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentExports.map((exp, i) => (
                                                <tr key={i} className="border-b border-slate-800/50 last:border-0">
                                                    <td className="py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center">
                                                                <Play className="w-3 h-3 text-indigo-400" />
                                                            </div>
                                                            <span className="font-medium">{exp.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-slate-400">{exp.duration}</td>
                                                    <td className="py-4 text-slate-400">{exp.size}</td>
                                                    <td className="py-4 text-slate-400">{exp.date}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
