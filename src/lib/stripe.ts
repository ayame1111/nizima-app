import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_build';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is missing. Stripe features will fail at runtime if not provided.');
}

export const stripe = new Stripe(stripeKey, {
  typescript: true,
});
