/* API client for backend communication */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface VideoMetadata {
    duration: number;
    width: number;
    height: number;
    fps: number;
    file_size: number;
    format: string;
}

export interface SubtitleStyle {
    font_family: string;
    font_size: number;
    font_color: string;
    background_color: string;
    outline_color: string;
    outline_width: number;
    position: 'top' | 'center' | 'bottom';
    bold: boolean;
    italic: boolean;
}

export interface SubtitleSegment {
    id: string;
    start_time: number;
    end_time: number;
    text: string;
    style: SubtitleStyle;
}

export interface Video {
    id: string;
    filename: string;
    original_filename: string;
    status: 'uploaded' | 'processing' | 'ready' | 'exporting' | 'exported' | 'error';
    metadata: VideoMetadata | null;
    subtitles: SubtitleSegment[];
    created_at: string;
    updated_at: string;
    exported_path: string | null;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface ChatResponse {
    message: string;
    edits: Array<{
        action: string;
        segment_id?: string;
        text?: string;
        start_time?: number;
        end_time?: number;
        style_changes?: Partial<SubtitleStyle>;
    }>;
    success: boolean;
    video_id: string;
}

class ApiClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(error.detail || `HTTP error ${response.status}`);
        }

        return response.json();
    }

    // Video endpoints
    async uploadVideo(file: File): Promise<{ id: string; filename: string; status: string; message: string }> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.baseUrl}/api/video/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
            throw new Error(error.detail);
        }

        return response.json();
    }

    async getVideo(videoId: string): Promise<Video> {
        return this.fetch<Video>(`/api/video/${videoId}`);
    }

    getVideoStreamUrl(videoId: string): string {
        return `${this.baseUrl}/api/video/${videoId}/stream`;
    }

    async listVideos(): Promise<{ videos: Video[] }> {
        return this.fetch('/api/video/list');
    }

    async deleteVideo(videoId: string): Promise<{ id: string; message: string }> {
        return this.fetch(`/api/video/${videoId}`, {
            method: 'DELETE',
        });
    }

    async exportVideo(videoId: string): Promise<Blob> {
        // First trigger the export
        await this.fetch(`/api/video/${videoId}/export`, {
            method: 'POST',
            body: JSON.stringify({ burn_subtitles: true, output_format: 'mp4' }),
        });

        // Then download the file
        const response = await fetch(`${this.baseUrl}/api/video/${videoId}/export/download`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Download failed' }));
            throw new Error(error.detail);
        }
        return response.blob();
    }

    getExportDownloadUrl(videoId: string): string {
        return `${this.baseUrl}/api/video/${videoId}/export/download`;
    }

    async trimSilence(videoId: string, options?: { silence_threshold?: number; min_silence_duration?: number; padding?: number }): Promise<{
        id: string;
        original_duration: number;
        new_duration: number;
        segments_removed: number;
        message: string;
    }> {
        return this.fetch(`/api/video/${videoId}/trim-silence`, {
            method: 'POST',
            body: JSON.stringify(options || {}),
        });
    }

    // Subtitle endpoints
    async generateSubtitles(videoId: string, defaultStyle?: Partial<SubtitleStyle>): Promise<{
        video_id: string;
        subtitles_count: number;
        subtitles: SubtitleSegment[];
        message: string;
    }> {
        return this.fetch(`/api/subtitle/generate/${videoId}`, {
            method: 'POST',
            body: JSON.stringify({ default_style: defaultStyle || null }),
        });
    }

    async getSubtitles(videoId: string): Promise<{
        video_id: string;
        subtitles: SubtitleSegment[];
        formatted: string;
    }> {
        return this.fetch(`/api/subtitle/${videoId}`);
    }

    async updateSubtitleStyle(videoId: string, segmentIds: string[] | null, styleUpdates: Partial<SubtitleStyle>): Promise<{
        video_id: string;
        updated_count: number;
        subtitles: SubtitleSegment[];
        message: string;
    }> {
        return this.fetch(`/api/subtitle/${videoId}/style`, {
            method: 'PUT',
            body: JSON.stringify({ segment_ids: segmentIds, style_updates: styleUpdates }),
        });
    }

    async translateSubtitles(videoId: string, targetLanguage: string): Promise<{
        video_id: string;
        target_language: string;
        subtitles_count: number;
        subtitles: SubtitleSegment[];
        message: string;
    }> {
        return this.fetch(`/api/subtitle/${videoId}/translate`, {
            method: 'POST',
            body: JSON.stringify({ target_language: targetLanguage }),
        });
    }

    // Chat endpoints
    async sendChatMessage(videoId: string, message: string): Promise<ChatResponse> {
        return this.fetch(`/api/chat/${videoId}`, {
            method: 'POST',
            body: JSON.stringify({ video_id: videoId, message }),
        });
    }

    async getChatHistory(videoId: string): Promise<{ video_id: string; messages: ChatMessage[]; count: number }> {
        return this.fetch(`/api/chat/${videoId}/history`);
    }

    async clearChatHistory(videoId: string): Promise<{ video_id: string; message: string }> {
        return this.fetch(`/api/chat/${videoId}/history`, { method: 'DELETE' });
    }

    // Transform portrait video to landscape (for Instagram reels etc.)
    async transformToLandscape(videoId: string, options?: {
        target_width?: number;
        target_height?: number;
        background_blur?: boolean;
    }): Promise<{
        id: string;
        original_width: number;
        original_height: number;
        new_width: number;
        new_height: number;
        message: string;
    }> {
        return this.fetch(`/api/video/${videoId}/transform-landscape`, {
            method: 'POST',
            body: JSON.stringify(options || {}),
        });
    }

    async checkIsPortrait(videoId: string): Promise<{
        id: string;
        is_portrait: boolean;
        width: number;
        height: number;
    }> {
        return this.fetch(`/api/video/${videoId}/is-portrait`);
    }

    // ===== User endpoints =====
    async getUserProfile(): Promise<{
        id: string;
        name: string;
        email: string;
        avatar: string | null;
        plan: string;
        created_at: string;
        storage_used_mb: number;
        storage_limit_mb: number;
    }> {
        return this.fetch('/api/user/profile');
    }

    async updateUserProfile(data: { name?: string; email?: string }): Promise<{ success: boolean; message: string }> {
        return this.fetch('/api/user/profile', { method: 'PUT', body: JSON.stringify(data) });
    }

    async getUserSettings(): Promise<{
        notifications: { email_notifications: boolean; export_complete: boolean; weekly_digest: boolean; product_updates: boolean };
        preferences: { default_language: string; default_subtitle_style: string; auto_generate_subtitles: boolean };
    }> {
        return this.fetch('/api/user/settings');
    }

    async updateUserSettings(data: object): Promise<{ success: boolean; message: string }> {
        return this.fetch('/api/user/settings', { method: 'PUT', body: JSON.stringify(data) });
    }

    async getUsageStats(): Promise<{
        total_videos: number;
        total_minutes_processed: number;
        total_exports: number;
        total_subtitles_generated: number;
        languages_used: string[];
    }> {
        return this.fetch('/api/user/usage');
    }

    async getSubscription(): Promise<{
        plan: string;
        status: string;
        limits: { videos_per_month: number; max_duration_minutes: number; storage_gb: number };
        usage: { videos_this_month: number; exports_this_month: number };
    }> {
        return this.fetch('/api/user/subscription');
    }

    // ===== Templates endpoints =====
    async listTemplates(): Promise<Array<{
        id: string;
        name: string;
        description: string;
        style: SubtitleStyle;
        is_default: boolean;
        is_favorite: boolean;
        is_system: boolean;
    }>> {
        return this.fetch('/api/templates/');
    }

    async getDefaultTemplate(): Promise<{ id: string; name: string; style: SubtitleStyle }> {
        return this.fetch('/api/templates/default');
    }

    async createTemplate(data: { name: string; description?: string; style: SubtitleStyle }): Promise<{ id: string; name: string }> {
        return this.fetch('/api/templates/', { method: 'POST', body: JSON.stringify(data) });
    }

    async updateTemplate(templateId: string, data: object): Promise<{ success: boolean }> {
        return this.fetch(`/api/templates/${templateId}`, { method: 'PUT', body: JSON.stringify(data) });
    }

    async deleteTemplate(templateId: string): Promise<{ success: boolean; message: string }> {
        return this.fetch(`/api/templates/${templateId}`, { method: 'DELETE' });
    }

    async duplicateTemplate(templateId: string): Promise<{ id: string; name: string }> {
        return this.fetch(`/api/templates/${templateId}/duplicate`, { method: 'POST' });
    }

    // ===== Analytics endpoints =====
    async getAnalyticsDashboard(timeRange: string = '30d'): Promise<{
        stats: Array<{ title: string; value: string; change: number; trend: string }>;
        activity: Array<{ date: string; value: number }>;
        languages: Array<{ language: string; count: number; percentage: number }>;
        recent_exports: Array<{ id: string; filename: string; duration: string; size: string; exported_at: string }>;
    }> {
        return this.fetch(`/api/analytics/dashboard?time_range=${timeRange}`);
    }

    async getVideoAnalytics(timeRange: string = '30d'): Promise<object> {
        return this.fetch(`/api/analytics/videos?time_range=${timeRange}`);
    }

    async getSubtitleAnalytics(timeRange: string = '30d'): Promise<object> {
        return this.fetch(`/api/analytics/subtitles?time_range=${timeRange}`);
    }

    async getUsageAnalytics(): Promise<{
        videos: { used: number; limit: number; percentage: number };
        minutes: { used: number; limit: number; percentage: number };
        storage: { used_gb: number; limit_gb: number; percentage: number };
    }> {
        return this.fetch('/api/analytics/usage');
    }

    // ===== Notifications endpoints =====
    async listNotifications(unreadOnly: boolean = false): Promise<Array<{
        id: string;
        type: string;
        category: string;
        title: string;
        message: string;
        read: boolean;
        action_url: string | null;
        created_at: string;
    }>> {
        return this.fetch(`/api/notifications/?unread_only=${unreadOnly}`);
    }

    async getUnreadCount(): Promise<{ count: number }> {
        return this.fetch('/api/notifications/unread-count');
    }

    async markNotificationsRead(notificationIds: string[]): Promise<{ success: boolean; marked_count: number }> {
        return this.fetch('/api/notifications/mark-read', { method: 'POST', body: JSON.stringify({ notification_ids: notificationIds }) });
    }

    async markAllNotificationsRead(): Promise<{ success: boolean; message: string }> {
        return this.fetch('/api/notifications/mark-all-read', { method: 'POST' });
    }

    async deleteNotification(notificationId: string): Promise<{ success: boolean; message: string }> {
        return this.fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
    }

    async clearAllNotifications(): Promise<{ success: boolean; message: string }> {
        return this.fetch('/api/notifications/', { method: 'DELETE' });
    }
}

export const api = new ApiClient();
