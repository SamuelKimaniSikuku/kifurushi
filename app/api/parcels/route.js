import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

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

// POST /api/parcels - Create a new parcel request
export async function POST(request) {
  const supabase = createServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

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
  } = body;

  if (!title || !origin_city || !destination_city || !weight_kg) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('parcels')
    .insert({
      sender_id: user.id,
      title,
      description: description || '',
      origin_city,
      origin_country: origin_country || '',
      destination_city,
      destination_country: destination_country || '',
      weight_kg: parseFloat(weight_kg),
      budget: budget ? parseFloat(budget) : null,
      deadline: deadline || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
