import { NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase-server';

// GET /api/parcels - List parcel requests with optional filters
export async function GET(request) {
  const supabase = createServerSupabase();
  const { searchParams } = new URL(request.url);

  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const status = searchParams.get('status') || 'open';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  let query = supabase
    .from('parcels')
    .select(`
      *,
      profiles:sender_id (
        full_name,
        avatar_url,
        subscription_tier,
        is_verified
      )
    `, { count: 'exact' })
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (from) query = query.ilike('origin_city', `%${from}%`);
  if (to) query = query.ilike('destination_city', `%${to}%`);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    parcels: data,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  });
}

// POST /api/parcels - Create a new parcel request.
// Works for logged-in users AND for guests (no account needed):
// guests provide guest_name + guest_contact; the contact is stored in the
// private parcel_contacts table and only released to Premium members.
export async function POST(request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const body = await request.json();
  const {
    title,
    description,
    origin_city,
    origin_country,
    destination_city,
    destination_country,
    weight_kg,
    budget,
    deadline,
    guest_name,
    guest_contact,
  } = body;

  if (!title || !origin_city || !destination_city || !weight_kg) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!user && (!guest_name?.trim() || !guest_contact?.trim())) {
    return NextResponse.json(
      { error: 'Please add your name and phone/WhatsApp so travelers can reach you' },
      { status: 400 }
    );
  }

  const row = {
    sender_id: user?.id || null,
    guest_name: user ? null : guest_name.trim(),
    title,
    description: description || '',
    origin_city,
    origin_country: origin_country || '',
    destination_city,
    destination_country: destination_country || '',
    weight_kg: parseFloat(weight_kg),
    budget: budget ? parseFloat(budget) : null,
    deadline: deadline || null,
  };

  // Guests write through the admin client (their contact must land in the
  // protected parcel_contacts table, which has no public access).
  const client = user ? supabase : createAdminSupabase();

  const { data, error } = await client.from('parcels').insert(row).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!user) {
    const admin = createAdminSupabase();
    const { error: contactError } = await admin
      .from('parcel_contacts')
      .insert({ parcel_id: data.id, contact: guest_contact.trim() });
    if (contactError) {
      await admin.from('parcels').delete().eq('id', data.id);
      return NextResponse.json({ error: 'Could not save contact — please try again' }, { status: 500 });
    }
  }

  return NextResponse.json(data, { status: 201 });
}
