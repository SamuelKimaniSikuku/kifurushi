import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

// GET /api/trips - List trips with optional filters
export async function GET(request) {
  const supabase = createServerSupabase();
  const { searchParams } = new URL(request.url);

  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  let query = supabase
    .from('trips')
    .select(`
      *,
      profiles:user_id (
        full_name,
        avatar_url,
        subscription_tier,
        avg_rating,
        total_ratings,
        is_verified
      )
    `, { count: 'exact' })
    .gte('departure_date', new Date().toISOString().split('T')[0])
    .order('departure_date', { ascending: true })
    .range((page - 1) * limit, page * limit - 1);

  if (from) query = query.ilike('origin_city', `%${from}%`);
  if (to) query = query.ilike('destination_city', `%${to}%`);
  if (dateFrom) query = query.gte('departure_date', dateFrom);
  if (dateTo) query = query.lte('departure_date', dateTo);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    trips: data,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  });
}

// POST /api/trips - Create a new trip
export async function POST(request) {
  const supabase = createServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const {
    origin_city,
    origin_country,
    destination_city,
    destination_country,
    departure_date,
    available_weight_kg,
    price_per_kg,
    notes,
  } = body;

  // Validation
  if (!origin_city || !destination_city || !departure_date || !available_weight_kg || !price_per_kg) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('trips')
    .insert({
      user_id: user.id,
      origin_city,
      origin_country: origin_country || '',
      destination_city,
      destination_country: destination_country || '',
      departure_date,
      available_weight_kg: parseFloat(available_weight_kg),
      price_per_kg: parseFloat(price_per_kg),
      notes: notes || '',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
