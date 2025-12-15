'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    Check,
    X,
    Sparkles,
    Zap,
    Building2,
    ArrowLeft,
    Crown,
    Star,
    Rocket
} from 'lucide-react';
import { GlobalStyles } from '@/components/shared';

interface PricingTier {
    id: string;
    name: string;
    description: string;
    price: number;
    priceYearly: number;
    icon: React.ReactNode;
    popular: boolean;
    features: { name: string; included: boolean }[];
    limits: {
        videos: number | 'unlimited';
        duration: number; // minutes per video
        storage: number; // GB
        exports: number | 'unlimited';
        languages: number | 'unlimited';
    };
    ctaText: string;
}

const pricingTiers: PricingTier[] = [
    {
        id: 'free',
        name: 'Starter',
        description: 'Perfect for trying out SubtitleAI',
        price: 0,
        priceYearly: 0,
        icon: <Sparkles className="w-6 h-6" />,
        popular: false,
        features: [
            { name: 'AI subtitle generation', included: true },
            { name: '720p video export', included: true },
            { name: 'Basic subtitle styling', included: true },
            { name: 'English subtitles only', included: true },
            { name: 'Priority support', included: false },
            { name: 'Custom branding', included: false },
            { name: 'API access', included: false },
            { name: 'Team collaboration', included: false },
        ],
        limits: {
            videos: 3,
            duration: 5,
            storage: 1,
            exports: 5,
            languages: 1,
        },
        ctaText: 'Get Started Free',
    },
    {
        id: 'pro',
        name: 'Professional',
        description: 'For content creators & freelancers',
        price: 29,
        priceYearly: 290,
        icon: <Zap className="w-6 h-6" />,
        popular: true,
        features: [
            { name: 'AI subtitle generation', included: true },
            { name: '4K video export', included: true },
            { name: 'Advanced subtitle styling', included: true },
            { name: 'Translation to 50+ languages', included: true },
            { name: 'Priority support', included: true },
            { name: 'Custom branding', included: true },
            { name: 'API access', included: false },
            { name: 'Team collaboration', included: false },
        ],
        limits: {
            videos: 50,
            duration: 30,
            storage: 25,
            exports: 100,
            languages: 50,
        },
        ctaText: 'Start Pro Trial',
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For teams & organizations',
        price: 99,
        priceYearly: 990,
        icon: <Building2 className="w-6 h-6" />,
        popular: false,
        features: [
            { name: 'AI subtitle generation', included: true },
            { name: '4K video export', included: true },
            { name: 'Advanced subtitle styling', included: true },
            { name: 'Translation to 100+ languages', included: true },
            { name: 'Priority support', included: true },
            { name: 'Custom branding', included: true },
            { name: 'API access', included: true },
            { name: 'Team collaboration', included: true },
        ],
        limits: {
            videos: 'unlimited',
            duration: 120,
            storage: 500,
            exports: 'unlimited',
            languages: 'unlimited',
        },
        ctaText: 'Contact Sales',
    },
];

const faqs = [
    {
        question: 'Can I switch plans later?',
        answer: 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll get immediate access to new features. When downgrading, changes take effect at the end of your billing cycle.',
    },
    {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for Enterprise plans.',
    },
    {
        question: 'Is there a free trial?',
        answer: 'Yes! Our Pro plan comes with a 14-day free trial. No credit card required to start.',
    },
    {
        question: 'What happens to my videos if I downgrade?',
        answer: 'Your videos remain accessible, but you won\'t be able to upload new ones if you exceed the lower plan\'s limits. You can always export your videos before downgrading.',
    },
    {
        question: 'Do you offer refunds?',
        answer: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied, contact us for a full refund.',
    },
    {
        question: 'Can I cancel anytime?',
        answer: 'Absolutely! You can cancel your subscription at any time from your account settings. No questions asked.',
    },
];

export default function PricingPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [isYearly, setIsYearly] = useState(false);
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const handleSelectPlan = (tier: PricingTier) => {
        if (!session) {
            router.push('/login');
            return;
        }
        
        if (tier.id === 'free') {
            router.push('/dashboard');
        } else if (tier.id === 'enterprise') {
            // Contact sales flow
            window.location.href = 'mailto:sales@subtitleai.com?subject=Enterprise Plan Inquiry';
        } else {
            // TODO: Integrate Stripe checkout
            router.push(`/checkout?plan=${tier.id}&billing=${isYearly ? 'yearly' : 'monthly'}`);
        }
    };

    return (
        <>
            <GlobalStyles />
            <div className="min-h-screen bg-[#020617] text-white">
                {/* Background Effects */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse"></div>
                    <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>

                {/* Navigation */}
                <nav className="relative z-10 px-6 py-6 flex items-center justify-between max-w-7xl mx-auto">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">SubtitleAI</span>
                    </div>
                    <div className="w-20"></div>
                </nav>

                {/* Header */}
                <div className="relative z-10 text-center pt-12 pb-16 px-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300 mb-6">
                        <Crown className="w-3 h-3" />
                        Simple, transparent pricing
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent">
                        Choose your plan
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
                        Start free and upgrade as you grow. No hidden fees, cancel anytime.
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4">
                        <span className={`text-sm font-medium ${!isYearly ? 'text-white' : 'text-slate-400'}`}>
                            Monthly
                        </span>
                        <button
                            onClick={() => setIsYearly(!isYearly)}
                            className={`relative w-14 h-7 rounded-full transition-colors ${
                                isYearly ? 'bg-indigo-600' : 'bg-slate-700'
                            }`}
                        >
                            <div
                                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg transition-transform ${
                                    isYearly ? 'translate-x-8' : 'translate-x-1'
                                }`}
                            />
                        </button>
                        <span className={`text-sm font-medium ${isYearly ? 'text-white' : 'text-slate-400'}`}>
                            Yearly
                        </span>
                        {isYearly && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
                                Save 17%
                            </span>
                        )}
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="relative z-10 max-w-6xl mx-auto px-4 pb-20">
                    <div className="grid md:grid-cols-3 gap-6">
                        {pricingTiers.map((tier, index) => (
                            <div
                                key={tier.id}
                                className={`relative rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ${
                                    tier.popular
                                        ? 'bg-gradient-to-b from-indigo-500/20 to-purple-500/10 border-2 border-indigo-500/50 shadow-xl shadow-indigo-500/10'
                                        : 'bg-slate-900/50 border border-slate-800 hover:border-slate-700'
                                }`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {tier.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-xs font-semibold text-white shadow-lg">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3 h-3" />
                                            Most Popular
                                        </div>
                                    </div>
                                )}

                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                                    tier.popular
                                        ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white'
                                        : 'bg-slate-800 text-slate-400'
                                }`}>
                                    {tier.icon}
                                </div>

                                <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                                <p className="text-sm text-slate-400 mb-6">{tier.description}</p>

                                <div className="mb-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold">
                                            ${isYearly ? Math.round(tier.priceYearly / 12) : tier.price}
                                        </span>
                                        <span className="text-slate-400">/month</span>
                                    </div>
                                    {tier.price > 0 && isYearly && (
                                        <p className="text-sm text-slate-500 mt-1">
                                            Billed ${tier.priceYearly}/year
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleSelectPlan(tier)}
                                    className={`w-full py-3 rounded-xl font-semibold transition-all mb-8 ${
                                        tier.popular
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-lg shadow-indigo-500/25'
                                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                                    }`}
                                >
                                    {tier.ctaText}
                                </button>

                                <div className="space-y-3">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Includes
                                    </h4>
                                    {tier.features.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            {feature.included ? (
                                                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-emerald-400" />
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-slate-800/50 flex items-center justify-center">
                                                    <X className="w-3 h-3 text-slate-600" />
                                                </div>
                                            )}
                                            <span className={feature.included ? 'text-slate-300' : 'text-slate-600'}>
                                                {feature.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-800">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                        Limits
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="text-slate-400">Videos:</div>
                                        <div className="text-white font-medium text-right">
                                            {tier.limits.videos === 'unlimited' ? '∞' : `${tier.limits.videos}/mo`}
                                        </div>
                                        <div className="text-slate-400">Duration:</div>
                                        <div className="text-white font-medium text-right">{tier.limits.duration} min</div>
                                        <div className="text-slate-400">Storage:</div>
                                        <div className="text-white font-medium text-right">{tier.limits.storage} GB</div>
                                        <div className="text-slate-400">Languages:</div>
                                        <div className="text-white font-medium text-right">
                                            {tier.limits.languages === 'unlimited' ? 'All' : tier.limits.languages}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="relative z-10 max-w-4xl mx-auto px-4 pb-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
                        <p className="text-slate-400">Everything you need to know about our plans</p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
                            >
                                <button
                                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                    className="w-full px-6 py-4 flex items-center justify-between text-left"
                                >
                                    <span className="font-medium">{faq.question}</span>
                                    <div
                                        className={`w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center transition-transform ${
                                            expandedFaq === index ? 'rotate-180' : ''
                                        }`}
                                    >
                                        <svg
                                            className="w-3 h-3 text-slate-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>
                                {expandedFaq === index && (
                                    <div className="px-6 pb-4 text-slate-400 text-sm animate-fadeIn">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div className="relative z-10 max-w-4xl mx-auto px-4 pb-20">
                    <div className="relative rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-90"></div>
                        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                        <div className="relative px-8 py-12 text-center">
                            <Rocket className="w-12 h-12 mx-auto mb-4 text-white/80" />
                            <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to get started?</h3>
                            <p className="text-indigo-100 mb-8 max-w-lg mx-auto">
                                Join thousands of content creators who trust SubtitleAI for their video captions.
                            </p>
                            <button
                                onClick={() => router.push('/login')}
                                className="px-8 py-4 bg-white text-indigo-600 rounded-full font-semibold hover:bg-indigo-50 transition-colors shadow-xl"
                            >
                                Start Your Free Trial
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="relative z-10 border-t border-slate-800 py-12">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-400" />
                                <span className="font-bold">SubtitleAI</span>
                            </div>
                            <div className="flex items-center gap-6 text-sm text-slate-400">
                                <a href="#" className="hover:text-white transition-colors">Terms</a>
                                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                                <a href="#" className="hover:text-white transition-colors">Contact</a>
                            </div>
                            <p className="text-sm text-slate-500">© 2024 SubtitleAI. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
