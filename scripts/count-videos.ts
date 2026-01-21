
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    const { count, error } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error(error);
        return;
    }
    console.log(`Current video count in DB: ${count}`);
}

main();
