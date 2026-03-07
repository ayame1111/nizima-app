import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.stripeAccountId) {
      return NextResponse.json({ error: 'No Stripe account found for this user' }, { status: 400 });
    }

    const { returnUrl, refreshUrl } = await req.json();

    // @ts-ignore - V2 types might not be fully exposed
    const accountLink = await stripe.v2.core.accountLinks.create({
      account: user.stripeAccountId,
      use_case: {
        type: 'account_onboarding',
        account_onboarding: {
          configurations: [
            'recipient',
            'merchant',
          ],
          refresh_url: refreshUrl || `${process.env.NEXTAUTH_URL}/dashboard`,
          return_url: returnUrl || `${process.env.NEXTAUTH_URL}/dashboard`,
        },
      },
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Stripe Onboard Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
