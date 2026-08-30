'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { fetchCategories, fetchEvents, fetchPlaces } from '@/lib/data';
import type { Category, Place, RideEvent } from '@/lib/types';

const MapView = dynamic(() => import('./MapView'), { ssr: false });

type Screen = 'map' | 'events' | 'add' | 'saved' | 'profile';

const fallbackTop = ['All', 'Hidden Gems', 'Cycling Cafés', 'Bike Shops', 'Bike Workshops', 'Bike Rental', 'Cycling Clubs'];

export default function AppShell() {
  const [screen, setScreen] = useState<Screen>('map');
  const [category, setCategory] = useState('All');
  const [subcategory, setSubcategory] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Place | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<RideEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSavedIds(JSON.parse(localStorage.getItem('bu:saved') || '[]'));
    setJoinedIds(JSON.parse(localStorage.getItem('bu:joined') || '[]'));
    (async () => {
      const cats = await fetchCategories();
      setCategories(cats);
      const [livePlaces, liveEvents] = await Promise.all([fetchPlaces(cats), fetchEvents()]);
      setPlaces(livePlaces);
      setEvents(liveEvents);
      setLoading(false);
    })();
  }, []);

  const topCategories = useMemo(() => {
    if (!categories.length) return fallbackTop;
    return ['All', ...categories.filter(c => !c.parent_id).sort((a,b)=>(a.sort_order ?? 0)-(b.sort_order ?? 0)).map(c => c.name)];
  }, [categories]);

  const hiddenGems = useMemo(() => {
    const parent = categories.find(c => c.slug === 'hidden-gems');
    if (!parent) return [];
    return categories.filter(c => c.parent_id === parent.id).sort((a,b)=>(a.sort_order ?? 0)-(b.sort_order ?? 0));
  }, [categories]);

  const persist = (key: string, value: string[]) => localStorage.setItem(key, JSON.stringify(value));
  const toggleSaved = (id: string) => {
    const next = savedIds.includes(id) ? savedIds.filter(x => x !== id) : [...savedIds, id];
    setSavedIds(next); persist('bu:saved', next);
  };
  const toggleJoined = (id: string) => {
    const next = joinedIds.includes(id) ? joinedIds.filter(x => x !== id) : [...joinedIds, id];
    setJoinedIds(next); persist('bu:joined', next);
  };
  const savedPlaces = useMemo(() => places.filter(p => savedIds.includes(p.id)), [places, savedIds]);

  const selectTopCategory = (name: string) => {
    setCategory(name);
    setSubcategory('');
  };

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-logo">BU</div><div><b>Bike Universe</b><small>COMMUNITY 2.0</small></div></div>
      <nav>{(['map','events','saved','profile'] as Screen[]).map(s => <button key={s} className={screen===s?'active':''} onClick={()=>setScreen(s)}>{s[0].toUpperCase()+s.slice(1)}</button>)}</nav>
      <button className="business-pill" onClick={()=>setScreen('profile')}>For Business</button>
    </header>

    <main>
      {screen==='map' && <section className="map-screen">
        <MapView places={places} activeCategory={category} activeSubcategory={subcategory} query={query} onSelect={setSelected}/>
        <div className="search-stack">
          <div className="searchbox"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search places, cities or areas…"/></div>
          <div className="chips">{topCategories.map(c=><button className={category===c?'active':''} key={c} onClick={()=>selectTopCategory(c)}>{c}</button>)}</div>
          {category === 'Hidden Gems' && hiddenGems.length > 0 && <div className="subchips">
            <button className={!subcategory?'active':''} onClick={()=>setSubcategory('')}>All Hidden Gems</button>
            {hiddenGems.map(c=><button className={subcategory===c.name?'active':''} key={c.id} onClick={()=>setSubcategory(c.name)}>{c.icon ? `${c.icon} ` : ''}{c.name}</button>)}
          </div>}
          {loading && <div className="data-status">Connecting to Bike Universe database…</div>}
          {!loading && places.length === 0 && <div className="data-status">Database connected — no published places yet.</div>}
        </div>
        {selected && <article className="place-sheet">
          <button className="x" onClick={()=>setSelected(null)}>×</button>
          <div className="place-visual">{selected.premium?'🔒':'🚴'}</div>
          <div className="place-info"><span className="eyebrow">{selected.parentCategory ? `${selected.parentCategory} · ${selected.category}` : selected.category}</span><h2>{selected.name}</h2><p>📍 {selected.city}, {selected.country} · ⭐ {selected.rating ?? 'New'}</p><p>{selected.description ?? 'A useful cycling-friendly place discovered by the Bike Universe community.'}</p><div className="actions"><button className="primary">View place</button><button onClick={()=>toggleSaved(selected.id)}>{savedIds.includes(selected.id)?'♥ Saved':'♡ Save'}</button><a href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}&travelmode=bicycling`} target="_blank">↗ Navigate</a></div></div>
        </article>}
      </section>}

      {screen==='events' && <section className="content-screen"><div className="page-head"><div><h1>Upcoming rides</h1><p>Find a ride, meet cyclists and explore new places together.</p></div><button className="cta" onClick={()=>setShowAdd(true)}>＋ Create event</button></div><div className="card-grid">{events.map(ev=><article className="event-card" key={ev.id}><div className="event-cover"><span>{ev.date}</span></div><div className="pad"><h3>{ev.title}</h3><p>📍 {ev.city}<br/>🚴 {ev.distanceKm} km · ↗ {ev.elevationM} m<br/>👥 {ev.going + (joinedIds.includes(ev.id)?1:0)} going</p><button className={joinedIds.includes(ev.id)?'joined':''} onClick={()=>toggleJoined(ev.id)}>{joinedIds.includes(ev.id)?'✓ You’re going':'Join ride'}</button></div></article>)}</div>{!events.length && <div className="empty">🚴<h3>No upcoming events yet</h3><p>Create the first ride in the new Community.</p></div>}</section>}

      {screen==='saved' && <section className="content-screen"><div className="page-head"><div><h1>Saved</h1><p>Your places and rides for later.</p></div></div>{savedPlaces.length ? <div className="saved-list">{savedPlaces.map(p=><article key={p.id}><div className="mini-visual">📍</div><div><span>{p.category}</span><h3>{p.name}</h3><p>{p.city}, {p.country}</p><button onClick={()=>toggleSaved(p.id)}>Remove</button></div></article>)}</div>:<div className="empty">♡<h3>No saved places yet</h3><p>Save interesting places from the map and they will appear here.</p></div>}</section>}

      {screen==='profile' && <section className="content-screen"><div className="page-head"><div><h1>Your profile</h1><p>One account for riding, events and business.</p></div></div><div className="profile-grid"><article className="profile-card"><div className="avatar">BU</div><h2>Bike Universe Rider</h2><p>Guest demo account</p><div className="metrics"><b>{savedIds.length}<small>Saved</small></b><b>{joinedIds.length}<small>Rides</small></b><b>0<small>Places</small></b></div></article><article className="club-card"><span>BIKE UNIVERSE CLUB</span><h2>Unlock Hidden Gems</h2><p>Premium locations, saved collections and future member-only features.</p><strong>€1 <small>/ month</small></strong><button>Unlock Club</button></article><article className="business-card"><span>FOR BUSINESS</span><h2>Get discovered by cyclists</h2><p>Claim your listing, add contact details and manage your presence.</p><strong>€12 <small>/ year</small></strong><button>Claim a business</button><button className="secondary">Boost for 7 days · €3</button></article></div></section>}
    </main>

    <nav className="mobile-nav">{(['map','events','add','saved','profile'] as Screen[]).map(s=><button key={s} className={`${screen===s?'active':''} ${s==='add'?'fab':''}`} onClick={()=>s==='add'?setShowAdd(true):setScreen(s)}><span>{s==='map'?'🗺️':s==='events'?'🚴':s==='add'?'+':s==='saved'?'♡':'👤'}</span>{s==='add'?'ADD':s.toUpperCase()}</button>)}</nav>

    {showAdd && <div className="modal" onClick={()=>setShowAdd(false)}><div className="modal-card" onClick={e=>e.stopPropagation()}><button className="x" onClick={()=>setShowAdd(false)}>×</button><h2>Add to Bike Universe</h2><p>Keep contribution fast and simple.</p><div className="add-grid"><button>📍<b>Add a Place</b><small>Name, category, location, photo</small></button><button>🚴<b>Create Event</b><small>Date, meeting point, ride details</small></button><button>🏢<b>Add Business</b><small>Create or claim a cycling business</small></button></div></div></div>}
  </div>;
}
