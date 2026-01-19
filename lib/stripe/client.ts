
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia', // Or latest supported version
    appInfo: {
        name: 'Starter Story Insights (JP)',
        version: '0.1.0',
    },
});
