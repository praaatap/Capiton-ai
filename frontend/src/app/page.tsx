'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload, Play, Sparkles, LayoutDashboard, Languages, Zap, Shield, Clock,
  Check, Star, ArrowRight, MessageSquare, Video, Globe, Wand2, ChevronDown,
  Twitter, Github, Linkedin, Mail
} from 'lucide-react';
import { GlobalStyles } from '@/components/shared';

const features = [
  {
    icon: <Wand2 className="w-6 h-6" />,
    title: 'AI-Powered Transcription',
    description: 'Upload your video and get accurate subtitles in seconds using Whisper AI technology.',
    color: 'indigo'
  },
  {
    icon: <Languages className="w-6 h-6" />,
    title: 'Instant Translation',
    description: 'Translate subtitles to 100+ languages with a single click. Reach a global audience.',
    color: 'purple'
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: 'AI Chat Editor',
    description: 'Edit subtitles using natural language. Just tell the AI what changes you want.',
    color: 'pink'
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: 'Perfect Timing',
    description: 'Automatic sync with precise timestamps. No manual adjustments needed.',
    color: 'amber'
  },
  {
    icon: <Video className="w-6 h-6" />,
    title: 'HD Video Export',
    description: 'Export videos with burned-in subtitles in up to 4K resolution.',
    color: 'emerald'
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Secure & Private',
    description: 'Your videos are encrypted and automatically deleted after processing.',
    color: 'cyan'
  },
];

const testimonials = [
  {
    quote: "SubtitleAI has completely transformed our workflow. What used to take hours now takes minutes.",
    author: "Sarah Chen",
    role: "Content Director, TechTube",
    avatar: "SC"
  },
  {
    quote: "The AI translation quality is incredible. We\'ve expanded to 12 new markets thanks to this tool.",
    author: "Marcus Rodriguez",
    role: "CEO, GlobalMedia Inc",
    avatar: "MR"
  },
  {
    quote: "Best subtitle tool I\'ve ever used. The chat-based editing is like magic.",
    author: "Emma Thompson",
    role: "YouTuber, 2M subscribers",
    avatar: "ET"
  },
];

const pricingPreview = [
  { name: 'Starter', price: 'Free', features: ['3 videos/month', '5 min max', 'English only'] },
  { name: 'Pro', price: '$29/mo', features: ['50 videos/month', '30 min max', '50+ languages'], popular: true },
  { name: 'Enterprise', price: '$99/mo', features: ['Unlimited videos', '2 hour max', 'API access'] },
];

const faqs = [
  { q: 'How accurate is the AI transcription?', a: 'Our AI achieves 95%+ accuracy for clear audio in supported languages.' },
  { q: 'What video formats are supported?', a: 'We support MP4, MOV, AVI, WebM, and most common video formats up to 2GB.' },
  { q: 'Can I edit subtitles after generation?', a: 'Yes! Use our AI chat or manual editor to make any changes you need.' },
  { q: 'Is my content secure?', a: 'Absolutely. All uploads are encrypted, and files are auto-deleted after 24 hours.' },
];

export default function LandingPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <GlobalStyles />
      <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#020617]">
        {/* Background */}
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
            <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#testimonials" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Testimonials</a>
            <a href="#pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/login')} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Log In</button>
            <button onClick={() => router.push('/login')} className="px-5 py-2.5 bg-white text-slate-950 text-sm font-semibold rounded-full hover:bg-indigo-50 transition-colors shadow-lg shadow-white/10">
              Get Started
            </button>
          </div>
        </nav>

        {/* Hero */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 pt-20 pb-32">
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
            <button onClick={() => router.push('/dashboard')} className="px-8 py-4 bg-indigo-600 text-white rounded-full font-semibold text-lg hover:bg-indigo-500 hover:scale-105 transition-all shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 group">
              <Upload className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
              Start Editing
            </button>
            <button className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full font-semibold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2 backdrop-blur-sm">
              <Play className="w-5 h-5 fill-current" />
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="mt-20 flex flex-wrap justify-center gap-12 animate-enter" style={{ animationDelay: '0.4s' }}>
            {[
              { value: '10M+', label: 'Minutes Processed' },
              { value: '50K+', label: 'Happy Users' },
              { value: '100+', label: 'Languages' },
              { value: '99.9%', label: 'Uptime' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </main>

        {/* Features Section */}
        <section id="features" className="relative z-10 py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">Features</span>
              <h2 className="text-4xl font-bold mt-4 mb-4">Everything you need for perfect subtitles</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">Powerful AI tools that make video captioning effortless</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <div key={i} className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-1 group">
                  <div className={`w-12 h-12 rounded-xl bg-${feature.color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <div className={`text-${feature.color}-400`}>{feature.icon}</div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="relative z-10 py-24 px-4 bg-slate-900/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">Testimonials</span>
              <h2 className="text-4xl font-bold mt-4 mb-4">Loved by creators worldwide</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div key={i} className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800 relative">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-amber-400 fill-current" />)}
                  </div>
                  <p className="text-slate-300 mb-6 leading-relaxed">&quot;{t.quote}&quot;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold">{t.avatar}</div>
                    <div>
                      <p className="font-medium">{t.author}</p>
                      <p className="text-sm text-slate-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section id="pricing" className="relative z-10 py-24 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">Pricing</span>
              <h2 className="text-4xl font-bold mt-4 mb-4">Simple, transparent pricing</h2>
              <p className="text-slate-400">Start free, upgrade when you need more</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {pricingPreview.map((plan, i) => (
                <div key={i} className={`p-6 rounded-2xl border transition-all ${plan.popular ? 'bg-indigo-500/10 border-indigo-500/30 scale-105' : 'bg-slate-900/50 border-slate-800'}`}>
                  {plan.popular && <span className="text-xs font-semibold text-indigo-400 uppercase">Most Popular</span>}
                  <h3 className="text-xl font-bold mt-2">{plan.name}</h3>
                  <div className="text-3xl font-bold mt-4 mb-6">{plan.price}</div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-slate-400">
                        <Check className="w-4 h-4 text-emerald-400" />{f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => router.push('/pricing')} className={`w-full py-3 rounded-xl font-semibold transition-colors ${plan.popular ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-800 hover:bg-slate-700'}`}>
                    Get Started
                  </button>
                </div>
              ))}
            </div>
            <p className="text-center mt-8 text-slate-500">
              <button onClick={() => router.push('/pricing')} className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 mx-auto">
                View full pricing details <ArrowRight className="w-4 h-4" />
              </button>
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="relative z-10 py-24 px-4 bg-slate-900/30">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">FAQ</span>
              <h2 className="text-4xl font-bold mt-4 mb-4">Common questions</h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-slate-800 rounded-xl overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-900/50">
                    <span className="font-medium">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && <div className="px-6 pb-4 text-slate-400 text-sm">{faq.a}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative z-10 py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to create perfect subtitles?</h2>
            <p className="text-slate-400 mb-8 text-lg">Join 50,000+ creators using SubtitleAI</p>
            <button onClick={() => router.push('/login')} className="px-10 py-4 bg-indigo-600 text-white rounded-full font-semibold text-lg hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/25">
              Get Started Free
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-slate-800 py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span className="font-bold">SubtitleAI</span>
                </div>
                <p className="text-sm text-slate-500">AI-powered video captioning for creators, businesses, and teams.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-400">Product</h4>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-400">Company</h4>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-400">Legal</h4>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-800">
              <p className="text-sm text-slate-500">© 2024 SubtitleAI. All rights reserved.</p>
              <div className="flex items-center gap-4 mt-4 md:mt-0">
                <a href="#" className="text-slate-500 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                <a href="#" className="text-slate-500 hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
                <a href="#" className="text-slate-500 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
                <a href="#" className="text-slate-500 hover:text-white transition-colors"><Mail className="w-5 h-5" /></a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}