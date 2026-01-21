
export interface User {
    id: string; // uuid
    email: string;
    stripe_customer_id?: string;
    subscription_status: 'active' | 'trialing' | 'canceled' | 'past_due' | 'unpaid';
    trial_end_date?: string; // timestamp
    is_admin?: boolean;
    email_frequency?: 'daily' | 'three_per_week' | 'weekly' | 'off';
    email_time?: string; // HH:MM format
    interested_categories?: string[]; // ['saas', 'ecommerce', 'app', 'content']
    created_at: string;
}

export interface VideoSummary {
    business_overview: string;
    key_metrics: string;
    acquisition_strategy: string;
    tools_used: string;
    japan_application: string;
    detailed_article?: string; // New field for long-form content (10 min read)
}

export interface Video {
    id: string; // uuid
    yt_video_id: string;
    title: string;
    summary_json: VideoSummary;
    published_at: string;
    thumbnail_url?: string;
    created_at: string;
}

export interface DeliveryLog {
    id: string;
    user_id: string;
    video_id: string;
    sent_at: string;
}
