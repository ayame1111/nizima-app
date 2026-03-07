import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Create a Connected Account
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user already has an account, return it
    if (user.stripeAccountId) {
      return NextResponse.json({ accountId: user.stripeAccountId });
    }

    // Create a new connected account with V2 API properties
    const account = await stripe.accounts.create({
      controller: {
        fees: {
          payer: 'application',
        },
        losses: {
          payments: 'application',
        },
        stripe_dashboard: {
          type: 'express',
        },
      },
      email: user.email || undefined,
      metadata: {
        userId: user.id,
      },
    });

    // Save account ID to database
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeAccountId: account.id },
    });

    return NextResponse.json({ accountId: account.id });
  } catch (error: any) {
    console.error('Stripe Account Create Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get Account Status
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.stripeAccountId) {
      return NextResponse.json({ connected: false });
    }

    // Retrieve account details directly from Stripe API
    const account = await stripe.accounts.retrieve(user.stripeAccountId);

    return NextResponse.json({
      connected: true,
      accountId: account.id,
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
    });
  } catch (error: any) {
    console.error('Stripe Account Retrieve Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
