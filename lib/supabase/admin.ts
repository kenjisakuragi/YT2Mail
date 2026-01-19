
import { createClient } from '@supabase/supabase-js';

// Admin Client (for background jobs & webhooks)
// Uses SERVICE_ROLE_KEY to bypass RLS.
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
    : null;
