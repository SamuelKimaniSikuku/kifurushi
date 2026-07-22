import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminSupabase } from '@/lib/supabase-server';
import { headers } from 'next/headers';

export async function POST(request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminSupabase();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.supabase_user_id;
        const plan = session.metadata.plan;

        // Update user's subscription tier
        await supabase
          .from('profiles')
          .update({
            subscription_tier: plan,
            stripe_subscription_id: session.subscription,
          })
          .eq('id', userId);

        // Log subscription event
        await supabase.from('subscription_events').insert({
          user_id: userId,
          event_type: 'subscribed',
          plan: plan,
          stripe_event_id: event.id,
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Find user by Stripe customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          const status = subscription.status;
          let tier = 'free';

          if (status === 'active' || status === 'trialing') {
            // Determine tier from price
            const priceId = subscription.items.data[0]?.price?.id;
            if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
              tier = 'pro';
            } else if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
              tier = 'premium';
            }
          }

          await supabase
            .from('profiles')
            .update({
              subscription_tier: tier,
              stripe_subscription_id: subscription.id,
            })
            .eq('id', profile.id);

          await supabase.from('subscription_events').insert({
            user_id: profile.id,
            event_type: 'updated',
            plan: tier,
            stripe_event_id: event.id,
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              subscription_tier: 'free',
              stripe_subscription_id: null,
            })
            .eq('id', profile.id);

          await supabase.from('subscription_events').insert({
            user_id: profile.id,
            event_type: 'cancelled',
            plan: 'free',
            stripe_event_id: event.id,
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase.from('subscription_events').insert({
            user_id: profile.id,
            event_type: 'payment_failed',
            plan: profile.subscription_tier || 'unknown',
            stripe_event_id: event.id,
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
