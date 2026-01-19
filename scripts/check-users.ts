
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
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

async function main() {
    if (!supabaseAdmin) {
        console.error('Supabase Admin not initialized');
        return;
    }

    const { data: users, error } = await supabaseAdmin.from('users').select('*');
    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    console.log('--- USERS ---');
    users.forEach(u => {
        console.log(`ID: ${u.id}`);
        console.log(`Email: ${u.email}`);
        console.log(`Status: ${u.subscription_status}`);
        console.log(`StripeID: ${u.stripe_customer_id}`);
        console.log('----------------');
    });
}

main();
