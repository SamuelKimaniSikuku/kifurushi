import { NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase-server';

// GET /api/contact?type=trip|parcel&id=<uuid>
// Returns the phone/WhatsApp of a trip's traveler or a parcel's sender.
// Contact details are ONLY released to Premium/Pro subscribers (or to the
// listing's own author). This check happens server-side, so free users can
// never scrape contacts from the browser.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  if (!['trip', 'parcel'].includes(type) || !id) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'login_required' }, { status: 401 });
  }

  const admin = createAdminSupabase();

  // Who owns the listing?
  let ownerId = null;
  let guestParcelId = null;

  if (type === 'trip') {
    const { data: trip } = await admin.from('trips').select('user_id').eq('id', id).single();
    if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    ownerId = trip.user_id;
  } else {
    const { data: parcel } = await admin.from('parcels').select('sender_id').eq('id', id).single();
    if (!parcel) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    ownerId = parcel.sender_id; // may be null for guest posts
    if (!ownerId) guestParcelId = id;
  }

  // Premium check (listing authors can always see their own contact)
  const { data: me } = await admin
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  const isPremium = ['premium', 'pro'].includes(me?.subscription_tier);
  const isOwner = ownerId === user.id;

  if (!isPremium && !isOwner) {
    return NextResponse.json({ error: 'premium_required' }, { status: 403 });
  }

  // Fetch the contact
  if (guestParcelId) {
    const { data: gc } = await admin
      .from('parcel_contacts')
      .select('contact')
      .eq('parcel_id', guestParcelId)
      .single();
    if (!gc) return NextResponse.json({ error: 'No contact on file' }, { status: 404 });
    return NextResponse.json({ name: null, phone: gc.contact, whatsapp: gc.contact });
  }

  const { data: owner } = await admin
    .from('profiles')
    .select('full_name, phone, whatsapp')
    .eq('id', ownerId)
    .single();

  if (!owner || (!owner.phone && !owner.whatsapp)) {
    return NextResponse.json({ error: 'This member has not added a contact number yet' }, { status: 404 });
  }

  return NextResponse.json({
    name: owner.full_name,
    phone: owner.phone || owner.whatsapp,
    whatsapp: owner.whatsapp || owner.phone,
  });
}
