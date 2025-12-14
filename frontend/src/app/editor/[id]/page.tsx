'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Upload,
    Play,
    Pause,
    Download,
    Sparkles,
    Send,
    Loader2,
    Scissors,
    Volume2,
    VolumeX,
    Languages,
    FileVideo,
    X,
    ChevronDown,
    Maximize2,
    SkipBack,
    SkipForward,
    Check,
    Monitor
} from 'lucide-react';
import { api, Video, ChatMessage } from '@/lib/api';
import { GlobalStyles } from '@/components/shared';

const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Tamil', 'Telugu', 'Bengali'];

export default function EditorPage() {
    const params = useParams();
    const router = useRouter();
    const videoId = params?.id as string;

    // State
    const [video, setVideo] = useState<Video | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isTrimming, setIsTrimming] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isTransformingLandscape, setIsTransformingLandscape] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'subtitles'>('chat');
    const [showExportModal, setShowExportModal] = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [exportLanguage, setExportLanguage] = useState('Original');
    const [subtitleLanguage, setSubtitleLanguage] = useState('English');
    const [showLangDropdown, setShowLangDropdown] = useState(false);

    // Video player state
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Load video
    const loadVideo = useCallback(async () => {
        if (!videoId || videoId === 'new') {
            setLoading(false);
            return;
        }
        try {
            const data = await api.getVideo(videoId);
            setVideo(data);
            const history = await api.getChatHistory(videoId);
            setChatMessages(history.messages || []);
        } catch {
            setError('Video not found');
        } finally {
            setLoading(false);
        }
    }, [videoId]);

    useEffect(() => { loadVideo(); }, [loadVideo]);

    // File upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const uploaded = await api.uploadVideo(file);
            router.replace(`/editor/${uploaded.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
            setLoading(false);
        }
    };

    const addBotMessage = (content: string) => {
        setChatMessages(prev => [...prev, { role: 'assistant', content, timestamp: new Date().toISOString() }]);
    };

    // Generate subtitles with language
    const handleGenerateSubtitles = async (lang: string) => {
        if (!video) return;
        setShowGenerateModal(false);
        setIsGenerating(true);
        try {
            await api.generateSubtitles(videoId);
            // If not English, translate after generation
            if (lang !== 'English') {
                await api.translateSubtitles(videoId, lang);
            }
            await loadVideo();
            addBotMessage(`✅ ${lang} subtitles generated with AI! You can now edit them.`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    // Send chat message
    const handleSendMessage = async () => {
        if (!chatInput.trim() || !video) return;
        const userMessage = chatInput.trim();
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date().toISOString() }]);
        setIsSending(true);
        try {
            const response = await api.sendChatMessage(videoId, userMessage);
            addBotMessage(response.message);
            await loadVideo();
        } catch (err) {
            addBotMessage(`❌ Error: ${err instanceof Error ? err.message : 'Failed'}`);
        } finally {
            setIsSending(false);
        }
    };

    // Translate
    const handleTranslate = async (lang: string) => {
        if (!video?.subtitles?.length) return;
        setShowLangDropdown(false);
        setIsTranslating(true);
        try {
            await api.translateSubtitles(videoId, lang);
            await loadVideo();
            addBotMessage(`✅ Translated subtitles to ${lang}!`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Translation failed');
        } finally {
            setIsTranslating(false);
        }
    };

    // Trim silence
    const handleTrimSilence = async () => {
        if (!video) return;
        setIsTrimming(true);
        try {
            await api.trimSilence(videoId);
            await loadVideo();
            addBotMessage('✅ Silent portions removed from video!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Trim failed');
        } finally {
            setIsTrimming(false);
        }
    };

    // Transform portrait video to landscape (for Instagram reels etc.)
    const handleTransformToLandscape = async () => {
        if (!video) return;
        setIsTransformingLandscape(true);
        try {
            const result = await api.transformToLandscape(videoId);
            await loadVideo();
            addBotMessage(`✅ Video transformed from portrait to landscape (${result.original_width}×${result.original_height} → ${result.new_width}×${result.new_height}). Captions will now display properly!`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Transform failed');
        } finally {
            setIsTransformingLandscape(false);
        }
    };

    // Check if video is portrait
    const isPortraitVideo = video?.metadata?.height && video?.metadata?.width && video.metadata.height > video.metadata.width;

    // Export with language option
    const handleExport = async () => {
        if (!video) return;
        setIsExporting(true);
        setShowExportModal(false);
        try {
            if (exportLanguage !== 'Original' && video.subtitles?.length) {
                await api.translateSubtitles(videoId, exportLanguage);
                await loadVideo();
            }
            const blob = await api.exportVideo(videoId);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const langSuffix = exportLanguage !== 'Original' ? `_${exportLanguage.toLowerCase()}` : '';
            a.download = `${video.filename.replace(/\.[^/.]+$/, '')}${langSuffix}_subtitled.mp4`;
            a.click();
            URL.revokeObjectURL(url);
            addBotMessage(`✅ Video exported with ${exportLanguage} subtitles!`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    // Video controls
    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) videoRef.current.pause();
        else videoRef.current.play();
    };

    const skip = (seconds: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
        }
    };

    const formatTime = (t: number) => {
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Current subtitle
    const currentSubtitle = video?.subtitles?.find(
        s => currentTime >= s.start_time && currentTime <= s.end_time
    );

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <GlobalStyles />
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    // Upload state
    if (!video || videoId === 'new') {
        return (
            <div className="min-h-screen bg-[#020617] flex flex-col">
                <GlobalStyles />
                <header className="h-16 border-b border-white/5 px-6 flex items-center bg-[#0a0f1a]">
                    <button onClick={() => router.push('/dashboard')} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="ml-4 font-semibold text-white">New Project</span>
                </header>
                <div className="flex-1 flex items-center justify-center p-8 bg-grid-pattern">
                    <label className="cursor-pointer group">
                        <div className="text-center p-16 rounded-3xl bg-slate-900/50 border-2 border-dashed border-slate-700 hover:border-indigo-500/60 transition-all max-w-xl">
                            <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                                <Upload className="w-12 h-12 text-indigo-400" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">Upload Your Video</h2>
                            <p className="text-slate-400 mb-8 text-lg">Drag and drop or click to select</p>
                            <div className="btn-primary px-8 py-4 rounded-xl inline-flex items-center gap-3 text-lg font-semibold">
                                <FileVideo className="w-6 h-6" />
                                Select Video File
                            </div>
                            <p className="text-sm text-slate-500 mt-6">MP4, MOV, AVI, MKV up to 500MB</p>
                        </div>
                        <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] flex flex-col">
            <GlobalStyles />

            {/* Error Toast */}
            {error && (
                <div className="fixed top-4 right-4 z-50 bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-3 rounded-xl flex items-center gap-3 backdrop-blur-sm">
                    {error}
                    <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Generate Subtitles Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">Generate Subtitles</h3>
                        <p className="text-slate-400 text-sm mb-6">Choose subtitle language</p>

                        <div className="space-y-2 max-h-80 overflow-y-auto mb-6">
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => setSubtitleLanguage(lang)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${subtitleLanguage === lang ? 'bg-indigo-500/10 border-indigo-500/50 text-white' : 'bg-slate-800/50 border-white/5 text-slate-300 hover:bg-slate-800'}`}
                                >
                                    <span className="font-medium">{lang}</span>
                                    {subtitleLanguage === lang && <Check className="w-5 h-5 text-indigo-400" />}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowGenerateModal(false)} className="flex-1 py-3 px-4 bg-slate-800 border border-white/10 rounded-xl text-slate-300 hover:bg-slate-700">
                                Cancel
                            </button>
                            <button onClick={() => handleGenerateSubtitles(subtitleLanguage)} className="flex-1 btn-primary py-3 px-4 rounded-xl flex items-center justify-center gap-2">
                                <Sparkles className="w-5 h-5" />
                                Generate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">Export Video</h3>
                        <p className="text-slate-400 text-sm mb-6">Choose subtitle language for export</p>

                        <div className="space-y-2 max-h-80 overflow-y-auto mb-6">
                            {['Original', ...LANGUAGES].map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => setExportLanguage(lang)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${exportLanguage === lang ? 'bg-indigo-500/10 border-indigo-500/50 text-white' : 'bg-slate-800/50 border-white/5 text-slate-300 hover:bg-slate-800'}`}
                                >
                                    <span className="font-medium">{lang} {lang === 'Original' && '(Current)'}</span>
                                    {exportLanguage === lang && <Check className="w-5 h-5 text-indigo-400" />}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowExportModal(false)} className="flex-1 py-3 px-4 bg-slate-800 border border-white/10 rounded-xl text-slate-300 hover:bg-slate-700">
                                Cancel
                            </button>
                            <button onClick={handleExport} disabled={isExporting} className="flex-1 btn-primary py-3 px-4 rounded-xl flex items-center justify-center gap-2">
                                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between flex-shrink-0 bg-[#0a0f1a]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/dashboard')} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-px bg-white/10"></div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                            <FileVideo className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <span className="font-semibold text-white block leading-tight">{video.filename}</span>
                            <span className="text-xs text-slate-500">{video.subtitles?.length || 0} subtitles</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleTrimSilence} disabled={isTrimming} className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-white/5 rounded-xl text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50">
                        {isTrimming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
                        <span className="hidden sm:inline">Trim</span>
                    </button>

                    {/* Translate Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowLangDropdown(!showLangDropdown)}
                            disabled={isTranslating || !video.subtitles?.length}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-white/5 rounded-xl text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                        >
                            {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                            <span className="hidden sm:inline">Translate</span>
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        {showLangDropdown && (
                            <div className="absolute top-full right-0 mt-2 w-44 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                                {LANGUAGES.map(lang => (
                                    <button key={lang} onClick={() => handleTranslate(lang)} className="block w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button onClick={() => setShowExportModal(true)} disabled={isExporting} className="btn-primary px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-medium">
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Export
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Video Area */}
                <div className="flex-1 flex flex-col bg-[#0a0f1a]">
                    <div className="flex-1 flex items-center justify-center p-6">
                        {/* Dynamic Video Container - adapts to video aspect ratio */}
                        <div className={`relative ${isPortraitVideo ? 'h-full max-h-[calc(100vh-200px)]' : 'w-full max-w-5xl'}`}>
                            <div
                                className="relative rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/10"
                                style={{
                                    aspectRatio: video.metadata?.width && video.metadata?.height
                                        ? `${video.metadata.width} / ${video.metadata.height}`
                                        : '16 / 9',
                                    maxHeight: isPortraitVideo ? 'calc(100vh - 200px)' : 'auto',
                                    maxWidth: isPortraitVideo ? 'auto' : '100%',
                                    margin: '0 auto'
                                }}
                            >
                                {/* Video Format Badge */}
                                <div className="absolute top-4 left-4 z-20">
                                    {isPortraitVideo ? (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/80 rounded-lg text-xs font-medium text-white shadow-lg">
                                            <FileVideo className="w-3 h-3" />
                                            Portrait (Reel)
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/80 rounded-lg text-xs font-medium text-white shadow-lg">
                                            <Monitor className="w-3 h-3" />
                                            Landscape
                                        </div>
                                    )}
                                </div>

                                {/* Dimension Badge */}
                                {video.metadata?.width && video.metadata?.height && (
                                    <div className="absolute top-4 right-4 z-20">
                                        <div className="px-2 py-1 bg-black/60 rounded text-[10px] font-mono text-white/80">
                                            {video.metadata.width}×{video.metadata.height}
                                        </div>
                                    </div>
                                )}

                                <video
                                    ref={videoRef}
                                    src={`http://localhost:8000/uploads/${video.filename}`}
                                    className="w-full h-full object-contain"
                                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    muted={isMuted}
                                    onClick={togglePlay}
                                />

                                {/* Subtitle Overlay */}
                                {currentSubtitle && (
                                    <div className={`absolute ${isPortraitVideo ? 'bottom-28' : 'bottom-20'} left-2 right-2 text-center pointer-events-none`}>
                                        <span
                                            className={`inline-block px-4 py-3 rounded-lg shadow-2xl bg-black/85 text-white ${isPortraitVideo ? 'text-sm leading-relaxed' : 'text-lg leading-normal'} font-medium`}
                                            style={{
                                                maxWidth: isPortraitVideo ? '95%' : '80%',
                                                wordBreak: 'break-word',
                                                whiteSpace: 'pre-wrap'
                                            }}
                                        >
                                            {currentSubtitle.text}
                                        </span>
                                    </div>
                                )}

                                {/* Controls */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-12">
                                    <div className="mb-4 cursor-pointer group" onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const pct = (e.clientX - rect.left) / rect.width;
                                        if (videoRef.current) videoRef.current.currentTime = pct * duration;
                                    }}>
                                        <div className="h-1 bg-white/20 rounded-full group-hover:h-1.5 transition-all">
                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(currentTime / duration) * 100 || 0}%` }} />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 sm:gap-4">
                                            <button onClick={() => skip(-10)} className="text-white/70 hover:text-white"><SkipBack className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                                            <button onClick={togglePlay} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                                                {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />}
                                            </button>
                                            <button onClick={() => skip(10)} className="text-white/70 hover:text-white"><SkipForward className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                                            <span className="text-xs sm:text-sm text-white/70 font-mono ml-1 sm:ml-2">{formatTime(currentTime)} / {formatTime(duration)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <button onClick={() => setIsMuted(!isMuted)} className="text-white/70 hover:text-white">
                                                {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                                            </button>
                                            <button className="text-white/70 hover:text-white"><Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Generate Subtitles Button */}
                            {(!video.subtitles || video.subtitles.length === 0) && (
                                <button onClick={() => setShowGenerateModal(true)} disabled={isGenerating} className="w-full mt-6 btn-primary py-4 sm:py-5 rounded-2xl flex items-center justify-center gap-3 text-base sm:text-lg font-semibold shadow-lg shadow-indigo-500/20">
                                    {isGenerating ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />}
                                    {isGenerating ? 'Generating...' : 'Generate Subtitles with AI'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-[380px] border-l border-white/5 bg-[#0f172a] flex flex-col">
                    <div className="flex border-b border-white/5 bg-[#0a0f1a]">
                        <button onClick={() => setActiveTab('chat')} className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}>
                            <Sparkles className="w-4 h-4" />
                            AI Chat
                        </button>
                        <button onClick={() => setActiveTab('subtitles')} className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'subtitles' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}>
                            <FileVideo className="w-4 h-4" />
                            Subtitles
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {activeTab === 'chat' ? (
                            <div className="space-y-4">
                                {chatMessages.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                            <Sparkles className="w-8 h-8 text-indigo-400" />
                                        </div>
                                        <h3 className="text-white font-semibold mb-2">AI Subtitle Editor</h3>
                                        <p className="text-slate-500 text-sm mb-6">Ask me to edit your subtitles</p>
                                        <div className="space-y-2 text-left">
                                            {['"make first subtitle bigger"', '"change color to red"', '"translate to Hindi"'].map(cmd => (
                                                <button key={cmd} onClick={() => setChatInput(cmd.replace(/"/g, ''))} className="block w-full text-left px-4 py-3 bg-slate-800/50 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800 border border-white/5">
                                                    {cmd}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {chatMessages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.role === 'assistant' && (
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center mr-2 flex-shrink-0">
                                                <Sparkles className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800/80 text-slate-300 rounded-tl-none border border-white/5'}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {isSending && (
                                    <div className="flex justify-start">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center mr-2">
                                            <Sparkles className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="bg-slate-800/80 p-4 rounded-2xl rounded-tl-none border border-white/5">
                                            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {video.subtitles?.length ? video.subtitles.map((sub, i) => (
                                    <div
                                        key={sub.id || i}
                                        onClick={() => { if (videoRef.current) videoRef.current.currentTime = sub.start_time; }}
                                        className={`p-4 rounded-xl border cursor-pointer ${currentTime >= sub.start_time && currentTime <= sub.end_time ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-800/30 border-white/5 hover:bg-slate-800/50'}`}
                                    >
                                        <div className="flex justify-between text-xs text-slate-500 mb-2">
                                            <span className="font-semibold text-indigo-400">#{i + 1}</span>
                                            <span className="font-mono">{formatTime(sub.start_time)} → {formatTime(sub.end_time)}</span>
                                        </div>
                                        <p className="text-white text-sm">{sub.text}</p>
                                    </div>
                                )) : (
                                    <div className="text-center py-12">
                                        <p className="text-slate-500">No subtitles yet</p>
                                        <p className="text-slate-600 text-sm mt-2">Generate subtitles first</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-white/5 bg-[#0a0f1a]">
                        <div className="relative">
                            <input
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                placeholder="Ask AI to edit subtitles..."
                                className="w-full bg-slate-900 border border-white/10 rounded-xl py-4 pl-5 pr-14 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                            />
                            <button onClick={handleSendMessage} disabled={isSending || !chatInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50">
                                <Send className="w-4 h-4 text-white" />
                            </button>
                        </div>
                        <p className="text-[10px] text-center text-slate-600 mt-3">Powered by Groq AI</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
