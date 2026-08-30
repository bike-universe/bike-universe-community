import { demoEvents, demoPlaces } from './demo-data';
import { getSupabaseBrowserClient } from './supabase';
import type { Category, Place, RideEvent } from './types';

export async function fetchCategories(): Promise<Category[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('categories')
    .select('id,name,slug,icon,parent_id,is_premium,sort_order')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.warn('Falling back from live categories:', error.message);
    return [];
  }
  return (data ?? []) as Category[];
}

export async function fetchPlaces(categories: Category[]): Promise<Place[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return demoPlaces;

  const { data, error } = await supabase
    .from('places')
    .select('id,name,short_description,description,country,city,latitude,longitude,category_id,is_premium,is_featured,average_rating,status')
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    console.warn('Falling back to demo places:', error.message);
    return demoPlaces;
  }

  const byId = new Map(categories.map((c) => [c.id, c]));
  return (data ?? []).map((row: any) => {
    const category = row.category_id ? byId.get(row.category_id) : undefined;
    const parent = category?.parent_id ? byId.get(category.parent_id) : undefined;
    return {
      id: row.id,
      name: row.name,
      category: category?.name ?? 'Other',
      categorySlug: category?.slug,
      parentCategory: parent?.name ?? null,
      city: row.city ?? '',
      country: row.country ?? '',
      lat: row.latitude,
      lng: row.longitude,
      rating: Number(row.average_rating ?? 0) || undefined,
      premium: Boolean(row.is_premium || category?.is_premium),
      featured: Boolean(row.is_featured),
      description: row.short_description || row.description || undefined,
    } satisfies Place;
  });
}

export async function fetchEvents(): Promise<RideEvent[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return demoEvents;

  const { data, error } = await supabase
    .from('events')
    .select('id,title,city,start_at,distance_km,elevation_m,status')
    .eq('status', 'published')
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .limit(30);

  if (error) {
    console.warn('Falling back to demo events:', error.message);
    return demoEvents;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    city: row.city ?? '',
    date: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(row.start_at)),
    distanceKm: Number(row.distance_km ?? 0),
    elevationM: Number(row.elevation_m ?? 0),
    going: 0,
  }));
}
