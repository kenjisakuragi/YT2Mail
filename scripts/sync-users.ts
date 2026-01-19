
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Service Role Key is required to read auth.users
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

async function syncUsers() {
    if (!supabaseAdmin) {
        console.error('Supabase Admin not initialized');
        return;
    }

    console.log('Fetching auth.users...');
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError || !authUsers) {
        console.error('Error fetching auth users:', authError);
        return;
    }

    console.log(`Found ${authUsers.length} users in Auth.`);

    for (const user of authUsers) {
        // Check if exists in public.users
        const { data: publicUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single();

        if (!publicUser) {
            console.log(`Syncing user: ${user.email}`);
            const { error: insertError } = await supabaseAdmin
                .from('users')
                .insert({
                    id: user.id,
                    email: user.email
                });

            if (insertError) {
                console.error(`Failed to sync ${user.email}:`, insertError);
            } else {
                console.log(`Synced ${user.email} successfully.`);
            }
        } else {
            console.log(`User ${user.email} already exists in public table.`);
        }
    }
}

syncUsers();
