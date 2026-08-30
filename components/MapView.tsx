'use client';

import { useEffect, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { Place } from '@/lib/types';

type Props = {
  places: Place[];
  activeCategory: string;
  activeSubcategory: string;
  query: string;
  onSelect: (place: Place) => void;
};

export default function MapView({ places, activeCategory, activeSubcategory, query, onSelect }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const filtered = useMemo(() => places.filter((p) => {
    const categoryOk = activeCategory === 'All'
      || p.category === activeCategory
      || p.parentCategory === activeCategory;
    const subcategoryOk = !activeSubcategory || p.category === activeSubcategory;
    const q = query.trim().toLowerCase();
    const queryOk = !q || `${p.name} ${p.city} ${p.country} ${p.category} ${p.parentCategory ?? ''}`.toLowerCase().includes(q);
    return categoryOk && subcategoryOk && queryOk;
  }), [places, activeCategory, activeSubcategory, query]);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: ref.current,
      center: [-8.5, 40.12],
      zoom: 6,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
      }
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    mapRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = filtered.map((place) => {
      const el = document.createElement('button');
      el.className = `map-pin ${place.premium ? 'premium' : ''}`;
      el.setAttribute('aria-label', place.name);
      const icon = place.parentCategory === 'Hidden Gems' || place.category === 'Hidden Gems' ? '💎'
        : place.category.includes('Café') ? '☕'
        : place.category.includes('Workshop') ? '🔧'
        : place.category.includes('Shop') ? '🚲'
        : place.category.includes('Rental') ? '🚴'
        : place.category.includes('Club') ? '👥'
        : '📍';
      el.innerHTML = `<span>${icon}</span>`;
      el.onclick = () => onSelect(place);
      return new maplibregl.Marker({ element: el }).setLngLat([place.lng, place.lat]).addTo(map);
    });
  }, [filtered, onSelect]);

  const locate = () => {
    navigator.geolocation?.getCurrentPosition((position) => {
      mapRef.current?.flyTo({ center: [position.coords.longitude, position.coords.latitude], zoom: 12 });
    });
  };

  return <><div ref={ref} className="map-canvas"/><button className="near-floating" onClick={locate}>◎ Near Me</button></>;
}
