import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
    console.log('=== Running User Preferences Migration ===');

    try {
        // Add columns if they don't exist
        const { error } = await supabase.rpc('exec_sql', {
            sql: `
                DO $$ 
                BEGIN
                    -- Add email_frequency column
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'users' AND column_name = 'email_frequency'
                    ) THEN
                        ALTER TABLE users ADD COLUMN email_frequency VARCHAR(20) DEFAULT 'daily';
                        ALTER TABLE users ADD CONSTRAINT email_frequency_check 
                            CHECK (email_frequency IN ('daily', 'three_per_week', 'weekly', 'off'));
                    END IF;

                    -- Add email_time column
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'users' AND column_name = 'email_time'
                    ) THEN
                        ALTER TABLE users ADD COLUMN email_time VARCHAR(10) DEFAULT '07:00';
                        ALTER TABLE users ADD CONSTRAINT email_time_check 
                            CHECK (email_time IN ('07:00', '12:00', '20:00'));
                    END IF;

                    -- Add interested_categories column
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'users' AND column_name = 'interested_categories'
                    ) THEN
                        ALTER TABLE users ADD COLUMN interested_categories TEXT[] 
                            DEFAULT ARRAY['saas', 'ecommerce', 'app', 'content'];
                    END IF;
                END $$;
            `
        });

        if (error) {
            console.error('Migration failed:', error);
            console.log('\nTrying alternative approach...');

            // Alternative: Direct SQL execution
            const queries = [
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_frequency VARCHAR(20) DEFAULT 'daily'`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_time VARCHAR(10) DEFAULT '07:00'`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS interested_categories TEXT[] DEFAULT ARRAY['saas', 'ecommerce', 'app', 'content']`
            ];

            for (const query of queries) {
                const { error: queryError } = await supabase.rpc('exec_sql', { sql: query });
                if (queryError) {
                    console.error(`Failed to execute: ${query}`, queryError);
                } else {
                    console.log(`✅ Executed: ${query.substring(0, 50)}...`);
                }
            }
        } else {
            console.log('✅ Migration completed successfully');
        }

        // Verify columns exist
        const { data: columns } = await supabase
            .from('users')
            .select('email_frequency, email_time, interested_categories')
            .limit(1);

        console.log('\nVerification:', columns ? '✅ Columns accessible' : '❌ Columns not found');

    } catch (e) {
        console.error('Error:', e);
        console.log('\n⚠️  Manual migration may be required. Please run the SQL from:');
        console.log('   supabase/migrations/20260121_add_user_preferences.sql');
    }
}

runMigration();
