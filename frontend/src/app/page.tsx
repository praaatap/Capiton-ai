'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Play, Sparkles, LayoutDashboard } from 'lucide-react';
import { GlobalStyles } from '@/components/shared';

export default function LandingPage() {
  const router = useRouter();

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <>
      <GlobalStyles />
      <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#020617]">
        {/* Mesh Gradient Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px] animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
        </div>

        {/* Navbar */}
        <nav className="relative z-10 px-6 py-6 flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">SubtitleAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/login')} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Log In</button>
            <button onClick={() => router.push('/login')} className="px-5 py-2.5 bg-white text-slate-950 text-sm font-semibold rounded-full hover:bg-indigo-50 transition-colors shadow-lg shadow-white/10">
              Get Started
            </button>
          </div>
        </nav>

        {/* Hero */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 mt-20 mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300 mb-8 animate-enter backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            v2.0 Now Available
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 max-w-4xl bg-gradient-to-b from-white via-white to-slate-500 bg-clip-text text-transparent animate-enter drop-shadow-sm" style={{ animationDelay: '0.1s' }}>
            Video captions, <br />
            <span className="text-indigo-400">perfected by AI.</span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mb-12 animate-enter leading-relaxed" style={{ animationDelay: '0.2s' }}>
            Stop transcribing manually. Upload your video, and let our AI handle sync, styling, and translation in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-enter" style={{ animationDelay: '0.3s' }}>
            <button onClick={goToDashboard} className="px-8 py-4 bg-indigo-600 text-white rounded-full font-semibold text-lg hover:bg-indigo-500 hover:scale-105 transition-all shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 group">
              <Upload className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
              Start Editing
            </button>
            <button className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full font-semibold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2 backdrop-blur-sm">
              <Play className="w-5 h-5 fill-current" />
              Watch Demo
            </button>
          </div>

          {/* Hero Image Mockup */}
          <div className="mt-24 relative max-w-6xl w-full animate-enter" style={{ animationDelay: '0.4s' }}>
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-lg opacity-30"></div>
            <div className="relative rounded-xl border border-white/10 bg-[#020617] shadow-2xl overflow-hidden ring-1 ring-white/5">
              <div className="h-10 bg-[#0f172a] border-b border-white/5 flex items-center gap-2 px-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-700/50"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-700/50"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-700/50"></div>
                </div>
                <div className="ml-4 px-3 py-1 bg-black/50 rounded-md border border-white/5 text-[10px] text-slate-500 font-mono flex-1 text-center max-w-md mx-auto">
                  subtitle.ai/dashboard
                </div>
              </div>
              <div className="aspect-video bg-[#020617] flex items-center justify-center text-slate-600 relative overflow-hidden bg-grid-pattern">
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent"></div>
                <div className="flex flex-col items-center gap-6 z-10">
                  <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 shadow-2xl">
                    <LayoutDashboard className="w-20 h-20 text-indigo-500/50" />
                  </div>
                  <p className="text-slate-500 font-medium tracking-wide">Dashboard Preview</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}