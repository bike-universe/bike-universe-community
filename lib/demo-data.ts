import type { Place, RideEvent } from './types';

export const demoPlaces: Place[] = [
  { id:'1', name:'Olhos de Água do Anços', category:'Hidden Gems', city:'Anços', country:'Portugal', lat:39.9928, lng:-8.5023, rating:4.9, premium:true, description:'Karst spring with crystal-clear water where the Anços River emerges from underground.' },
  { id:'2', name:'Montemor-o-Velho Castle', category:'Hidden Gems', city:'Montemor-o-Velho', country:'Portugal', lat:40.1721, lng:-8.6848, rating:4.8, description:'Historic hilltop castle and scenic viewpoint over the Mondego valley.' },
  { id:'3', name:'Cycling Café Coimbra', category:'Cafés', city:'Coimbra', country:'Portugal', lat:40.2056, lng:-8.4196, rating:4.7 },
  { id:'4', name:'Bike Repair Coimbra', category:'Repair', city:'Coimbra', country:'Portugal', lat:40.2110, lng:-8.4290, rating:4.6 },
  { id:'5', name:'Weekend Social Ride', category:'Events', city:'Soure', country:'Portugal', lat:40.0597, lng:-8.6261, rating:5 }
];

export const demoEvents: RideEvent[] = [
  { id:'e1', title:'Weekend Social Ride', city:'Coimbra', date:'Sep 6 · 09:30', distanceKm:65, elevationM:620, going:8 },
  { id:'e2', title:'Hidden Gems Gravel Ride', city:'Soure', date:'Sep 13 · 10:00', distanceKm:82, elevationM:780, going:5 },
  { id:'e3', title:'Easy Sunday Coffee Ride', city:'Montemor-o-Velho', date:'Sep 20 · 09:00', distanceKm:52, elevationM:280, going:11 }
];
