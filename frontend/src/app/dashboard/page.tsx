'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
    Plus,
    Play,
    Settings,
    Trash2,
    Clock,
    FileVideo,
    Subtitles,
    Loader2,
    RefreshCw,
    History,
    RotateCcw,
    Monitor
} from 'lucide-react';
import { GlobalStyles, Sidebar, Topbar } from '@/components/shared';
import { api, Video } from '@/lib/api';

export default function DashboardPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [activeTab, setActiveTab] = useState('projects');
    const [projects, setProjects] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // Fetch projects from backend
    const fetchProjects = useCallback(async () => {
        try {
            const data = await api.listVideos();
            setProjects(data.videos || []);
        } catch (err) {
            console.error('Failed to fetch projects:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchProjects();
        }
    }, [fetchProjects, status]);

    const handleLogout = async () => {
        await signOut({ redirect: false });
        router.push('/');
    };

    const handleOpenEditor = (id: string) => {
        router.push(`/editor/${id}`);
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        if (tab === 'upload') {
            router.push('/editor/new');
        }
    };

    const handleDeleteVideo = async (e: React.MouseEvent, videoId: string) => {
        e.stopPropagation(); // Prevent opening editor
        if (!confirm('Are you sure you want to delete this video?')) {
            return;
        }
        try {
            await api.deleteVideo(videoId);
            // Remove from local state
            setProjects(prev => prev.filter(p => p.id !== videoId));
        } catch (err) {
            console.error('Failed to delete video:', err);
            alert('Failed to delete video');
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ready':
            case 'exported':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'processing':
            case 'exporting':
                return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            case 'error':
                return 'bg-red-500/10 text-red-400 border-red-500/20';
            default:
                return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans">
            <GlobalStyles />

            <Sidebar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onLogout={handleLogout}
            />

            <div className="ml-[260px] min-h-screen flex flex-col">
                <Topbar />

                <main className="flex-1 relative overflow-hidden">
                    {/* Background Effects */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none"></div>
                    <div className="fixed top-20 right-20 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
                    <div className="fixed bottom-0 left-20 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none"></div>

                    <div className="relative z-10">
                        {activeTab === 'settings' ? (
                            <div className="flex items-center justify-center h-[calc(100vh-64px)] text-slate-500">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-slate-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                                        <Settings className="w-10 h-10 opacity-50" />
                                    </div>
                                    <p className="font-medium text-lg">Settings</p>
                                    <p className="text-sm text-slate-600 mt-1">Coming soon</p>
                                </div>
                            </div>
                        ) : activeTab === 'history' ? (
                            <div className="p-8">
                                {/* History Header */}
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                                            <History className="w-8 h-8 text-indigo-400" />
                                            Video History
                                        </h1>
                                        <p className="text-slate-400">Previously edited and exported videos</p>
                                    </div>
                                    <button
                                        onClick={fetchProjects}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-white/5 rounded-xl text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Refresh
                                    </button>
                                </div>

                                {/* Loading State */}
                                {loading ? (
                                    <div className="flex items-center justify-center py-32">
                                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Filter exported/completed videos */}
                                        {projects.filter(p => p.status === 'exported' || p.subtitles?.length > 0).length === 0 ? (
                                            <div className="text-center py-20">
                                                <div className="w-20 h-20 bg-slate-900/50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5">
                                                    <History className="w-10 h-10 text-slate-600" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-white mb-2">No history yet</h3>
                                                <p className="text-slate-500 mb-6">Your edited videos will appear here</p>
                                            </div>
                                        ) : (
                                            projects
                                                .filter(p => p.status === 'exported' || p.subtitles?.length > 0)
                                                .map((project) => (
                                                    <div
                                                        key={project.id}
                                                        className="flex items-center gap-6 p-4 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-indigo-500/30 cursor-pointer transition-all hover:shadow-xl hover:shadow-indigo-500/5"
                                                        onClick={() => handleOpenEditor(project.id)}
                                                    >
                                                        {/* Thumbnail */}
                                                        <div className="w-32 h-20 bg-slate-800/50 rounded-xl relative flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10"></div>
                                                            <FileVideo className="w-8 h-8 text-slate-600 relative z-10" />
                                                            {/* Portrait indicator */}
                                                            {project.metadata?.width && project.metadata?.height && project.metadata.height > project.metadata.width && (
                                                                <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-orange-500/80 rounded text-[8px] font-bold text-white">
                                                                    PORTRAIT
                                                                </span>
                                                            )}
                                                            {project.metadata?.duration && (
                                                                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[9px] font-mono text-white">
                                                                    {formatDuration(project.metadata.duration)}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-white truncate mb-1">
                                                                {project.original_filename || project.filename}
                                                            </h3>
                                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {formatDate(project.updated_at)}
                                                                </span>
                                                                {project.subtitles?.length > 0 && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Subtitles className="w-3 h-3" />
                                                                        {project.subtitles.length} subtitles
                                                                    </span>
                                                                )}
                                                                {project.metadata?.width && project.metadata?.height && (
                                                                    <span className="font-mono">
                                                                        {project.metadata.width}×{project.metadata.height}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Status & Actions */}
                                                        <div className="flex items-center gap-3 flex-shrink-0">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${getStatusColor(project.status)}`}>
                                                                {project.status}
                                                            </span>
                                                            <button
                                                                onClick={(e) => handleDeleteVideo(e, project.id)}
                                                                className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                                title="Delete video"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-8">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h1 className="text-3xl font-bold text-white mb-2">Your Projects</h1>
                                        <p className="text-slate-400">Create and manage your video subtitles</p>
                                    </div>
                                    <button
                                        onClick={fetchProjects}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-white/5 rounded-xl text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Refresh
                                    </button>
                                </div>

                                {/* Loading State */}
                                {loading ? (
                                    <div className="flex items-center justify-center py-32">
                                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {/* Create New Card */}
                                        <div
                                            onClick={() => handleOpenEditor('new')}
                                            className="h-72 rounded-2xl border-2 border-dashed border-slate-700/50 bg-slate-900/20 hover:bg-slate-900/40 hover:border-indigo-500/50 flex flex-col items-center justify-center cursor-pointer group transition-all"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all border border-white/5">
                                                <Plus className="w-7 h-7 text-slate-400 group-hover:text-indigo-400" />
                                            </div>
                                            <p className="font-semibold text-slate-300 group-hover:text-indigo-300 transition-colors">New Project</p>
                                            <p className="text-sm text-slate-500 mt-1">Upload video</p>
                                        </div>

                                        {/* Project Cards */}
                                        {projects.map((project) => (
                                            <div
                                                key={project.id}
                                                className="h-72 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-indigo-500/30 overflow-hidden group cursor-pointer transition-all hover:shadow-xl hover:shadow-indigo-500/5"
                                                onClick={() => handleOpenEditor(project.id)}
                                            >
                                                {/* Thumbnail */}
                                                <div className="h-36 bg-slate-800/50 relative flex items-center justify-center overflow-hidden">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10"></div>
                                                    <FileVideo className="w-12 h-12 text-slate-600 relative z-10" />

                                                    {/* Hover Play Button */}
                                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                                                        <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                                            <Play className="w-6 h-6 text-white ml-1" fill="white" />
                                                        </div>
                                                    </div>

                                                    {/* Duration Badge */}
                                                    {project.metadata?.duration && (
                                                        <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md text-[10px] font-mono text-white border border-white/10">
                                                            {formatDuration(project.metadata.duration)}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="p-5">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h3 className="font-semibold text-sm text-white truncate pr-4 group-hover:text-indigo-300 transition-colors max-w-[180px]">
                                                            {project.original_filename || project.filename}
                                                        </h3>
                                                        <button
                                                            onClick={(e) => handleDeleteVideo(e, project.id)}
                                                            className="text-slate-600 hover:text-red-400 p-1 -mr-1 transition-colors"
                                                            title="Delete video"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    {/* Meta Info */}
                                                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {formatDate(project.updated_at)}
                                                        </span>
                                                        {project.subtitles?.length > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <Subtitles className="w-3 h-3" />
                                                                {project.subtitles.length}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Status */}
                                                    <div className="flex items-center justify-between">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${getStatusColor(project.status)}`}>
                                                            {project.status}
                                                        </span>
                                                        {project.metadata?.width && project.metadata?.height && (
                                                            <span className="text-[10px] text-slate-600 font-mono">
                                                                {project.metadata.width}×{project.metadata.height}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Empty State */}
                                        {/* {projects.length === 0 && !loading && (
                                            <div className="col-span-full text-center py-20">
                                                <div className="w-20 h-20 bg-slate-900/50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5">
                                                    <FileVideo className="w-10 h-10 text-slate-600" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-white mb-2">No projects yet</h3>
                                                <p className="text-slate-500 mb-6">Upload your first video to get started</p>
                                                <button
                                                    onClick={() => handleOpenEditor('new')}
                                                    className="btn-primary px-6 py-3 rounded-xl inline-flex items-center gap-2"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                    Create Project
                                                </button>
                                            </div>
                                        )} */}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
