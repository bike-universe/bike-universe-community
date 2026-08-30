export type Category = {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  parent_id?: number | null;
  is_premium?: boolean;
  sort_order?: number;
};

export type Place = {
  id: string;
  name: string;
  category: string;
  categorySlug?: string;
  parentCategory?: string | null;
  city: string;
  country: string;
  lat: number;
  lng: number;
  rating?: number;
  premium?: boolean;
  featured?: boolean;
  description?: string;
};

export type RideEvent = {
  id: string;
  title: string;
  city: string;
  date: string;
  distanceKm: number;
  elevationM: number;
  going: number;
};
