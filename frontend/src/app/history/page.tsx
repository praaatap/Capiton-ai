'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
    Clock, FileVideo, Download, Languages, Search, Filter, Loader2,
    Calendar, ChevronDown, Play, Trash2, MoreVertical
} from 'lucide-react';
import { GlobalStyles, Sidebar, Topbar } from '@/components/shared';

interface HistoryItem {
    id: string;
    type: 'upload' | 'subtitle' | 'translate' | 'export';
    title: string;
    description: string;
    videoName: string;
    videoId: string;
    timestamp: string;
    metadata?: Record<string, string | number>;
}

const mockHistory: HistoryItem[] = [
    {
        id: '1', type: 'export', title: 'Video Exported',
        description: 'Exported with burned-in subtitles',
        videoName: 'Marketing_Video_Final.mp4', videoId: 'v1',
        timestamp: '2 hours ago', metadata: { size: '45 MB', duration: '3:45' }
    },
    {
        id: '2', type: 'translate', title: 'Subtitles Translated',
        description: 'Translated to Spanish',
        videoName: 'Product_Demo.mp4', videoId: 'v2',
        timestamp: '5 hours ago', metadata: { from: 'English', to: 'Spanish', count: 24 }
    },
    {
        id: '3', type: 'subtitle', title: 'Subtitles Generated',
        description: '42 subtitles created automatically',
        videoName: 'Tutorial_Basics.mp4', videoId: 'v3',
        timestamp: 'Yesterday', metadata: { count: 42, language: 'English' }
    },
    {
        id: '4', type: 'upload', title: 'Video Uploaded',
        description: 'New video added to library',
        videoName: 'Interview_Raw.mp4', videoId: 'v4',
        timestamp: 'Yesterday', metadata: { size: '245 MB', duration: '15:30' }
    },
    {
        id: '5', type: 'export', title: 'Video Exported',
        description: 'Exported with Hindi subtitles',
        videoName: 'Course_Intro.mp4', videoId: 'v5',
        timestamp: '2 days ago', metadata: { size: '128 MB', duration: '8:22' }
    },
    {
        id: '6', type: 'subtitle', title: 'Subtitles Generated',
        description: '18 subtitles created automatically',
        videoName: 'Podcast_Ep12.mp4', videoId: 'v6',
        timestamp: '3 days ago', metadata: { count: 18, language: 'English' }
    },
];

const typeIcons = {
    upload: FileVideo,
    subtitle: Languages,
    translate: Languages,
    export: Download,
};

const typeColors = {
    upload: 'indigo',
    subtitle: 'emerald',
    translate: 'purple',
    export: 'amber',
};

export default function HistoryPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [history, setHistory] = useState<HistoryItem[]>(mockHistory);
    const [filter, setFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
        setTimeout(() => setLoading(false), 500);
    }, [status, router]);

    const handleLogout = async () => await signOut({ callbackUrl: '/login' });

    const filteredHistory = history.filter(item => {
        const matchesFilter = filter === 'all' || item.type === filter;
        const matchesSearch = item.videoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const handleOpenVideo = (videoId: string) => {
        router.push(`/editor/${videoId}`);
    };

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
                <Sidebar activeTab="history" onTabChange={(tab) => router.push(`/${tab}`)} />
                <div className="flex-1 flex flex-col min-h-screen ml-[260px]">
                    <Topbar userName={session?.user?.name || 'User'} onLogout={handleLogout} />

                    <main className="flex-1 p-6 lg:p-10 overflow-auto">
                        <div className="max-w-5xl mx-auto">
                            {/* Header */}
                            <div className="mb-8">
                                <h1 className="text-3xl font-bold mb-2">Activity History</h1>
                                <p className="text-slate-400">Track all your video processing activity</p>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-col md:flex-row gap-4 mb-8">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Search history..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {['all', 'upload', 'subtitle', 'translate', 'export'].map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800'
                                                }`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* History List */}
                            <div className="space-y-4">
                                {filteredHistory.map((item) => {
                                    const Icon = typeIcons[item.type];
                                    const color = typeColors[item.type];

                                    return (
                                        <div
                                            key={item.id}
                                            className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-all group"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`w-10 h-10 rounded-lg bg-${color}-500/10 flex items-center justify-center flex-shrink-0`}>
                                                    <Icon className={`w-5 h-5 text-${color}-400`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <h3 className="font-semibold">{item.title}</h3>
                                                            <p className="text-sm text-slate-400 mt-0.5">{item.description}</p>
                                                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                                                <FileVideo className="w-3 h-3" />
                                                                {item.videoName}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleOpenVideo(item.videoId)}
                                                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                                                title="Open in editor"
                                                            >
                                                                <Play className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {item.metadata && (
                                                        <div className="flex gap-4 mt-3 text-xs text-slate-500">
                                                            {Object.entries(item.metadata).map(([key, value]) => (
                                                                <span key={key} className="capitalize">
                                                                    {key}: <span className="text-slate-400">{value}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-sm text-slate-500 flex items-center gap-1 flex-shrink-0">
                                                    <Clock className="w-3 h-3" />
                                                    {item.timestamp}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {filteredHistory.length === 0 && (
                                <div className="text-center py-20">
                                    <Clock className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">No history found</h3>
                                    <p className="text-slate-400">
                                        {searchQuery ? 'Try a different search term' : 'Your activity history will appear here'}
                                    </p>
                                </div>
                            )}

                            {/* Load More */}
                            {filteredHistory.length > 0 && (
                                <div className="text-center mt-8">
                                    <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium transition-colors">
                                        Load More
                                    </button>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
