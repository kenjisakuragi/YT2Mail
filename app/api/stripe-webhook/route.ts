import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe as stripeClient } from '@/lib/stripe/client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import Stripe from 'stripe';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        event = stripeClient.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === 'checkout.session.completed') {
        const subscription = await stripeClient.subscriptions.retrieve(
            session.subscription as string
        );

        if (!session.metadata?.userId) {
            return new NextResponse('User ID is missing in metadata', { status: 400 });
        }

        // Update User
        await supabaseAdmin
            ?.from('users')
            .update({
                stripe_customer_id: session.customer as string,
                subscription_status: subscription.status,
                trial_end_date: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            })
            .eq('id', session.metadata.userId);
    }

    if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as Stripe.Subscription;
        // Find user by customer ID
        // This might be tricky if I don't store user ID in subscription metadata, 
        // but I stored stripe_customer_id in users table.

        await supabaseAdmin
            ?.from('users')
            .update({
                subscription_status: subscription.status,
                trial_end_date: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            })
            .eq('stripe_customer_id', subscription.customer as string);
    }

    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription;

        await supabaseAdmin
            ?.from('users')
            .update({
                subscription_status: 'canceled',
            })
            .eq('stripe_customer_id', subscription.customer as string);
    }

    return new NextResponse(null, { status: 200 });
}
