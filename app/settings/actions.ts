'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateUserPreferences(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const userId = formData.get('userId') as string;

    // Verify user owns this data
    if (userId !== user.id) {
        throw new Error('Unauthorized');
    }

    // Extract form data
    const emailFrequency = formData.get('email_frequency') as string | null;
    const emailTime = formData.get('email_time') as string | null;
    const interestedCategories = formData.getAll('interested_categories') as string[];

    // Build update object
    const updates: any = {};

    if (emailFrequency) {
        updates.email_frequency = emailFrequency;
    }

    if (emailTime) {
        updates.email_time = emailTime;
    }

    if (interestedCategories.length > 0) {
        updates.interested_categories = interestedCategories;
    }

    // Update database
    const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

    if (error) {
        console.error('Failed to update preferences:', error);
        throw new Error('設定の更新に失敗しました');
    }

    // Revalidate the settings page
    revalidatePath('/settings');

    // Redirect back to settings with success message
    redirect('/settings?success=true');
}
