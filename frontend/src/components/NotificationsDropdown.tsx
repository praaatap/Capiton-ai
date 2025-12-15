'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, FileVideo, Languages, CreditCard, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    category: string;
    title: string;
    message: string;
    read: boolean;
    action_url: string | null;
    created_at: string;
}

const typeIcons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: X,
};

const typeColors = {
    info: 'text-blue-400 bg-blue-500/10',
    success: 'text-emerald-400 bg-emerald-500/10',
    warning: 'text-amber-400 bg-amber-500/10',
    error: 'text-red-400 bg-red-500/10',
};

export default function NotificationsDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    // Fetch unread count on mount
    useEffect(() => {
        fetchUnreadCount();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await api.listNotifications();
            setNotifications(data as Notification[]);
            setUnreadCount(data.filter(n => !n.read).length);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            // Use mock data for demo
            setNotifications([
                {
                    id: '1', type: 'success', category: 'export',
                    title: 'Export Complete', message: 'Your video has been exported successfully.',
                    read: false, action_url: '/dashboard', created_at: new Date().toISOString()
                },
                {
                    id: '2', type: 'info', category: 'subtitle',
                    title: 'Subtitles Generated', message: '24 subtitles were created.',
                    read: false, action_url: null, created_at: new Date().toISOString()
                },
                {
                    id: '3', type: 'warning', category: 'billing',
                    title: 'Approaching Limit', message: "You've used 80% of your quota.",
                    read: true, action_url: '/pricing', created_at: new Date().toISOString()
                },
            ]);
            setUnreadCount(2);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const data = await api.getUnreadCount();
            setUnreadCount(data.count);
        } catch (error) {
            // Silently fail for polling
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await api.markNotificationsRead([id]);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-white transition-colors"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-indigo-500 rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-[#020617]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="font-semibold">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-slate-500">
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No notifications</p>
                            </div>
                        ) : (
                            notifications.map((notification) => {
                                const Icon = typeIcons[notification.type];
                                const colorClass = typeColors[notification.type];

                                return (
                                    <div
                                        key={notification.id}
                                        className={`px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors cursor-pointer ${!notification.read ? 'bg-slate-800/30' : ''
                                            }`}
                                        onClick={() => {
                                            if (!notification.read) handleMarkAsRead(notification.id);
                                            if (notification.action_url) {
                                                window.location.href = notification.action_url;
                                            }
                                        }}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`font-medium text-sm ${!notification.read ? 'text-white' : 'text-slate-300'}`}>
                                                        {notification.title}
                                                    </p>
                                                    {!notification.read && (
                                                        <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5"></span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[10px] text-slate-600 mt-1">
                                                    {formatTimeAgo(notification.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-3 border-t border-slate-800 text-center">
                            <a
                                href="/settings?tab=notifications"
                                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                Notification Settings
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
