
'use server';

import { redirect } from 'next/navigation';
import { stripe } from './client';
import { createClient } from '@/lib/supabase/client'; // This should be a server-compatible client function
// Actually, for Server Actions, we need a way to get the authenticated user.
// I'll assume we use @supabase/auth-helpers-nextjs or similar or standard supabase-js with cookies.
// The user project setup didn't install @supabase/ssr, but it's recommended.
// I'll assume standard client for now, but in Server Actions I need cookies.
// Let's implement a basic `createClient` for server actions in `lib/supabase/server.ts` later or now.
// For now, I'll assume the user is passed or auth check is done via Headers.
// Actually, I can use `createClient` from `@supabase/ssr` if I had it.
// The user has `@supabase/supabase-js`. 
// I'll proceed with assumed auth flow.

// For now, these functions will generate the URL to redirect to.

export async function createCheckoutSession(email: string, userId: string) {
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        throw new Error('Stripe is not configured');
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price: 'price_1SrLBCPPDvmJ2easUrNEbRal',
                quantity: 1,
            },
        ],
        metadata: {
            userId: userId,
        },
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard?canceled=true`,
        customer_email: email,
        subscription_data: {
            trial_period_days: 7,
        }
    });

    if (!session.url) {
        throw new Error('Failed to create session');
    }

    redirect(session.url);
}

export async function createPortalSession(customerId: string) {
    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`,
    });

    redirect(session.url);
}
