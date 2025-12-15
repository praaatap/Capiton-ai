'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
    Palette, Plus, Check, Star, Trash2, Copy, Loader2, ChevronDown,
    Type, AlignCenter, AlignLeft, AlignRight, Bold, Italic
} from 'lucide-react';
import { GlobalStyles, Sidebar, Topbar } from '@/components/shared';

interface SubtitleTemplate {
    id: string;
    name: string;
    description: string;
    isDefault: boolean;
    isFavorite: boolean;
    style: {
        fontFamily: string;
        fontSize: number;
        fontColor: string;
        backgroundColor: string;
        outlineColor: string;
        outlineWidth: number;
        position: 'top' | 'center' | 'bottom';
        bold: boolean;
        italic: boolean;
    };
    previewText: string;
}

const defaultTemplates: SubtitleTemplate[] = [
    {
        id: '1', name: 'Classic', description: 'Clean white text with black outline',
        isDefault: true, isFavorite: true,
        style: {
            fontFamily: 'Arial', fontSize: 24, fontColor: '#FFFFFF', backgroundColor: 'transparent',
            outlineColor: '#000000', outlineWidth: 2, position: 'bottom', bold: false, italic: false
        },
        previewText: 'The quick brown fox jumps'
    },
    {
        id: '2', name: 'Cinematic', description: 'Yellow text for movie-style captions',
        isDefault: false, isFavorite: false,
        style: {
            fontFamily: 'Georgia', fontSize: 26, fontColor: '#FFD700', backgroundColor: 'transparent',
            outlineColor: '#000000', outlineWidth: 2, position: 'bottom', bold: false, italic: true
        },
        previewText: 'The quick brown fox jumps'
    },
    {
        id: '3', name: 'Modern Dark', description: 'Semi-transparent dark background',
        isDefault: false, isFavorite: true,
        style: {
            fontFamily: 'Inter', fontSize: 22, fontColor: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.7)',
            outlineColor: 'transparent', outlineWidth: 0, position: 'bottom', bold: true, italic: false
        },
        previewText: 'The quick brown fox jumps'
    },
    {
        id: '4', name: 'YouTube Style', description: 'Perfect for YouTube content',
        isDefault: false, isFavorite: false,
        style: {
            fontFamily: 'Roboto', fontSize: 24, fontColor: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.8)',
            outlineColor: 'transparent', outlineWidth: 0, position: 'bottom', bold: true, italic: false
        },
        previewText: 'The quick brown fox jumps'
    },
    {
        id: '5', name: 'Netflix', description: 'Netflix-inspired subtitle style',
        isDefault: false, isFavorite: true,
        style: {
            fontFamily: 'Arial', fontSize: 28, fontColor: '#FFFFFF', backgroundColor: 'transparent',
            outlineColor: '#000000', outlineWidth: 4, position: 'bottom', bold: true, italic: false
        },
        previewText: 'The quick brown fox jumps'
    },
    {
        id: '6', name: 'Minimal', description: 'Simple and clean',
        isDefault: false, isFavorite: false,
        style: {
            fontFamily: 'Helvetica', fontSize: 20, fontColor: '#E0E0E0', backgroundColor: 'transparent',
            outlineColor: 'transparent', outlineWidth: 0, position: 'bottom', bold: false, italic: false
        },
        previewText: 'The quick brown fox jumps'
    },
];

export default function TemplatesPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [templates, setTemplates] = useState<SubtitleTemplate[]>(defaultTemplates);
    const [selectedTemplate, setSelectedTemplate] = useState<SubtitleTemplate | null>(null);
    const [filter, setFilter] = useState<'all' | 'favorites' | 'custom'>('all');
    const [showEditor, setShowEditor] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
        setTimeout(() => setLoading(false), 500);
    }, [status, router]);

    const handleLogout = async () => await signOut({ callbackUrl: '/login' });

    const handleToggleFavorite = (id: string) => {
        setTemplates(templates.map(t => t.id === id ? { ...t, isFavorite: !t.isFavorite } : t));
    };

    const handleDuplicate = (template: SubtitleTemplate) => {
        const newTemplate = { ...template, id: Date.now().toString(), name: `${template.name} (Copy)`, isDefault: false };
        setTemplates([...templates, newTemplate]);
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete this template?')) {
            setTemplates(templates.filter(t => t.id !== id));
        }
    };

    const handleSetDefault = (id: string) => {
        setTemplates(templates.map(t => ({ ...t, isDefault: t.id === id })));
    };

    const filteredTemplates = templates.filter(t => {
        if (filter === 'favorites') return t.isFavorite;
        if (filter === 'custom') return !defaultTemplates.find(d => d.id === t.id);
        return true;
    });

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
                <Sidebar activeTab="templates" onTabChange={(tab) => router.push(`/${tab}`)} />
                <div className="flex-1 flex flex-col min-h-screen">
                    <Topbar userName={session?.user?.name || 'User'} onLogout={handleLogout} />

                    <main className="flex-1 p-6 lg:p-10 overflow-auto">
                        <div className="max-w-6xl mx-auto">
                            {/* Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Subtitle Templates</h1>
                                    <p className="text-slate-400">Create and manage your subtitle styles</p>
                                </div>
                                <button onClick={() => setShowEditor(true)}
                                    className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-colors">
                                    <Plus className="w-5 h-5" /> Create Template
                                </button>
                            </div>

                            {/* Filters */}
                            <div className="flex gap-2 mb-8">
                                {(['all', 'favorites', 'custom'] as const).map((f) => (
                                    <button key={f} onClick={() => setFilter(f)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800'
                                            }`}>
                                        {f === 'all' ? 'All Templates' : f}
                                    </button>
                                ))}
                            </div>

                            {/* Templates Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredTemplates.map((template) => (
                                    <div key={template.id}
                                        className={`p-6 bg-slate-900/50 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] ${template.isDefault ? 'border-indigo-500/50' : 'border-slate-800 hover:border-slate-700'
                                            }`}
                                        onClick={() => setSelectedTemplate(template)}>

                                        {/* Preview */}
                                        <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg mb-4 flex items-end justify-center p-4 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-5" />
                                            <div style={{
                                                fontFamily: template.style.fontFamily,
                                                fontSize: `${template.style.fontSize * 0.6}px`,
                                                color: template.style.fontColor,
                                                backgroundColor: template.style.backgroundColor,
                                                textShadow: template.style.outlineWidth > 0
                                                    ? `${template.style.outlineWidth}px ${template.style.outlineWidth}px 0 ${template.style.outlineColor}`
                                                    : 'none',
                                                fontWeight: template.style.bold ? 'bold' : 'normal',
                                                fontStyle: template.style.italic ? 'italic' : 'normal',
                                                padding: '4px 8px', borderRadius: '4px'
                                            }}>
                                                {template.previewText}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-semibold flex items-center gap-2">
                                                    {template.name}
                                                    {template.isDefault && (
                                                        <span className="px-2 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-400 rounded-full">Default</span>
                                                    )}
                                                </h3>
                                                <p className="text-sm text-slate-400">{template.description}</p>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); handleToggleFavorite(template.id); }}
                                                className={`p-1 rounded ${template.isFavorite ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'}`}>
                                                <Star className="w-4 h-4" fill={template.isFavorite ? 'currentColor' : 'none'} />
                                            </button>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800">
                                            <button onClick={(e) => { e.stopPropagation(); handleSetDefault(template.id); }}
                                                className="flex-1 py-2 text-sm text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors">
                                                Set Default
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDuplicate(template); }}
                                                className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            {!defaultTemplates.find(d => d.id === template.id) && (
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(template.id); }}
                                                    className="p-2 text-red-400 hover:text-red-300 bg-slate-800/50 hover:bg-red-500/10 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {filteredTemplates.length === 0 && (
                                <div className="text-center py-20">
                                    <Palette className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">No templates found</h3>
                                    <p className="text-slate-400 mb-6">Create your first custom template</p>
                                    <button onClick={() => setShowEditor(true)}
                                        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-colors">
                                        Create Template
                                    </button>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            {/* Template Editor Modal */}
            {(showEditor || selectedTemplate) && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => { setShowEditor(false); setSelectedTemplate(null); }}>
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-auto"
                        onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-800">
                            <h2 className="text-xl font-bold">{selectedTemplate ? 'Edit Template' : 'Create Template'}</h2>
                        </div>
                        <div className="p-6">
                            <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl mb-6 flex items-end justify-center p-6">
                                <div className="text-white text-xl font-bold px-4 py-2 bg-black/70 rounded-lg">
                                    Preview Text
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Template Name</label>
                                    <input type="text" placeholder="My Template" className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Font Family</label>
                                    <select className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg">
                                        <option>Arial</option><option>Roboto</option><option>Inter</option><option>Georgia</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Font Size</label>
                                    <input type="number" defaultValue={24} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Font Color</label>
                                    <input type="color" defaultValue="#FFFFFF" className="w-full h-12 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer" />
                                </div>
                            </div>
                            <div className="flex gap-4 justify-end">
                                <button onClick={() => { setShowEditor(false); setSelectedTemplate(null); }}
                                    className="px-5 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors">
                                    Cancel
                                </button>
                                <button className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition-colors">
                                    Save Template
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
