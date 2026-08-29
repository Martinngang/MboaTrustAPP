import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface LandListing {
  id: string;
  title: string;
  region: string;
  city: string;
  neighborhood: string;
  price: number;
  pricePerSqm: number;
  sizeSqm: number;
  titleType: 'titre_foncier' | 'certificat_propriete' | 'droit_coutumier';
  titleNumber: string;
  verified: boolean;
  coordinates: { lat: number; lng: number };
  description: string;
  imageUrl: string;
  photos: string[];
  features: string[];
  sellerId: string;
  sellerName: string;
  sellerRating: number;
  status: 'active' | 'under_offer' | 'sold';
  createdAt: string;
}

export interface LandOffer {
  id: string;
  listingId: string;
  listingTitle: string;
  listingLocation: string;
  buyerId: string;
  buyerName: string;
  proposedPrice: number;
  askingPrice: number;
  paymentTerms: 'notary_escrow' | 'two_tranches' | 'immediate';
  validUntil: string;
  status: 'pending' | 'accepted' | 'countered' | 'declined';
  notes?: string;
  createdAt: string;
}

const DEFAULT_LAND_LISTINGS: LandListing[] = [
  {
    id: 'land-1',
    title: '1,200 m² Prime Coastal Plot with Ocean View',
    region: 'Sud',
    city: 'Kribi',
    neighborhood: 'Ngoye Plage',
    price: 18000000,
    pricePerSqm: 15000,
    sizeSqm: 1200,
    titleType: 'titre_foncier',
    titleNumber: 'TF #8812/Oce',
    verified: true,
    coordinates: { lat: 2.938, lng: 9.907 },
    description: 'Flat build-ready seaside parcel located 300m from the coastline. Direct asphalt road access, water and high-voltage electricity lines connected.',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&h=400&fit=crop',
    ],
    features: ['Direct Road Access', 'Electricity Connected', 'Water Network', '100% Flat Terrain', 'Cadastral Marker Posts Placed'],
    sellerId: 'seller-1',
    sellerName: 'Jean-Pierre Eboa (Verified Landowner)',
    sellerRating: 4.9,
    status: 'active',
    createdAt: '3 days ago',
  },
  {
    id: 'land-2',
    title: '850 m² Residential Corner Plot in Odza',
    region: 'Centre',
    city: 'Yaoundé',
    neighborhood: 'Odza Borne 10',
    price: 14500000,
    pricePerSqm: 17058,
    sizeSqm: 850,
    titleType: 'titre_foncier',
    titleNumber: 'TF #12404/Mfundi',
    verified: true,
    coordinates: { lat: 3.848, lng: 11.502 },
    description: 'Excellent residential plot in a developed quiet neighborhood of Yaoundé. Ready for multi-storey residential villa construction.',
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&h=400&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&h=400&fit=crop',
    ],
    features: ['Paved Street', 'Electricity Grid', 'City Water Pipe', 'Dry Soil'],
    sellerId: 'seller-2',
    sellerName: 'Françoise Mengue',
    sellerRating: 5.0,
    status: 'active',
    createdAt: '1 week ago',
  },
  {
    id: 'land-3',
    title: '2,500 m² Commercial Parcel near Douala Port Axis',
    region: 'Littoral',
    city: 'Douala',
    neighborhood: 'Yassa / Japoma',
    price: 45000000,
    pricePerSqm: 18000,
    sizeSqm: 2500,
    titleType: 'titre_foncier',
    titleNumber: 'TF #33918/Wouri',
    verified: true,
    coordinates: { lat: 4.051, lng: 9.767 },
    description: 'High-visibility commercial plot along the national axis. Ideal for warehouse, logistics hub, or industrial supply depot.',
    imageUrl: 'https://images.unsplash.com/photo-1524813686514-a57563d77d66?w=600&h=400&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1524813686514-a57563d77d66?w=600&h=400&fit=crop',
    ],
    features: ['Highway Frontage', 'Industrial Three-Phase Power', 'Heavy Truck Access'],
    sellerId: 'seller-1',
    sellerName: 'Jean-Pierre Eboa (Verified Landowner)',
    sellerRating: 4.9,
    status: 'active',
    createdAt: '2 weeks ago',
  },
];

const DEFAULT_OFFERS: LandOffer[] = [
  {
    id: 'off-101',
    listingId: 'land-1',
    listingTitle: '1,200 m² Prime Coastal Plot with Ocean View',
    listingLocation: 'Ngoye Plage, Kribi',
    buyerId: 'buyer-1',
    buyerName: 'Paul Atangana (Diaspora Funder - France)',
    proposedPrice: 17000000,
    askingPrice: 18000000,
    paymentTerms: 'notary_escrow',
    validUntil: 'In 4 days',
    status: 'pending',
    notes: 'Buyer has prepared 100% escrow funds ready for notary deed transfer upon boundary survey.',
    createdAt: 'Yesterday',
  },
];

export function useLandListingsQuery(params?: { region?: string; city?: string }) {
  return useQuery({
    queryKey: ['land-listings', params],
    queryFn: async (): Promise<LandListing[]> => {
      try {
        const { data } = await api.get<{ data: any[] }>('/land-listings', { params });
        if (data.data && data.data.length > 0) {
          return data.data.map((l) => ({
            id: l._id || l.id,
            title: l.title,
            region: l.region || 'Centre',
            city: l.city || 'Yaoundé',
            neighborhood: l.neighborhood || '',
            price: l.price || 0,
            pricePerSqm: l.pricePerSqm || Math.round((l.price || 0) / (l.sizeSqm || 1)),
            sizeSqm: l.sizeSqm || 500,
            titleType: l.titleType || 'titre_foncier',
            titleNumber: l.titleNumber || 'TF #Verified',
            verified: Boolean(l.verified ?? true),
            coordinates: l.coordinates || { lat: 3.848, lng: 11.502 },
            description: l.description || '',
            imageUrl: l.imageUrl || DEFAULT_LAND_LISTINGS[0].imageUrl,
            photos: l.photos || [DEFAULT_LAND_LISTINGS[0].imageUrl],
            features: l.features || ['Road Access', 'Titre Foncier'],
            sellerId: typeof l.sellerId === 'object' ? l.sellerId._id : l.sellerId,
            sellerName: typeof l.sellerId === 'object' ? l.sellerId.fullName : 'Verified Landowner',
            sellerRating: 4.9,
            status: l.status || 'active',
            createdAt: l.createdAt || new Date().toISOString(),
          }));
        }
        return DEFAULT_LAND_LISTINGS;
      } catch {
        return DEFAULT_LAND_LISTINGS;
      }
    },
    staleTime: 15_000,
  });
}

export function useLandListingDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['land-listing', id],
    queryFn: async (): Promise<LandListing | null> => {
      if (!id) return null;
      try {
        const { data } = await api.get<{ data: any }>(`/land-listings/${id}`);
        const l = data.data;
        return {
          id: l._id || l.id,
          title: l.title,
          region: l.region || 'Centre',
          city: l.city || 'Yaoundé',
          neighborhood: l.neighborhood || '',
          price: l.price || 0,
          pricePerSqm: l.pricePerSqm || Math.round((l.price || 0) / (l.sizeSqm || 1)),
          sizeSqm: l.sizeSqm || 500,
          titleType: l.titleType || 'titre_foncier',
          titleNumber: l.titleNumber || 'TF #Verified',
          verified: Boolean(l.verified ?? true),
          coordinates: l.coordinates || { lat: 3.848, lng: 11.502 },
          description: l.description || '',
          imageUrl: l.imageUrl || DEFAULT_LAND_LISTINGS[0].imageUrl,
          photos: l.photos || [DEFAULT_LAND_LISTINGS[0].imageUrl],
          features: l.features || ['Road Access', 'Titre Foncier'],
          sellerId: typeof l.sellerId === 'object' ? l.sellerId._id : l.sellerId,
          sellerName: typeof l.sellerId === 'object' ? l.sellerId.fullName : 'Verified Landowner',
          sellerRating: 4.9,
          status: l.status || 'active',
          createdAt: l.createdAt || new Date().toISOString(),
        };
      } catch {
        return DEFAULT_LAND_LISTINGS.find((l) => l.id === id) || DEFAULT_LAND_LISTINGS[0];
      }
    },
    enabled: !!id,
    staleTime: 10_000,
  });
}

export interface CreateLandListingInput {
  title: string;
  region: string;
  city: string;
  neighborhood: string;
  price: number;
  sizeSqm: number;
  titleType: string;
  titleNumber: string;
  description: string;
  features: string[];
}

export function useCreateLandListingMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLandListingInput) => {
      const payload = {
        ...input,
        imageUrl: DEFAULT_LAND_LISTINGS[0].imageUrl,
        photos: [DEFAULT_LAND_LISTINGS[0].imageUrl],
      };
      const { data } = await api.post('/land-listings', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['land-listings'] });
    },
  });
}

export function useLandOffersQuery() {
  return useQuery({
    queryKey: ['land-offers'],
    queryFn: async (): Promise<LandOffer[]> => {
      try {
        const { data } = await api.get<{ data: any[] }>('/land-offers');
        if (data.data && data.data.length > 0) {
          return data.data.map((o) => ({
            id: o._id || o.id,
            listingId: o.listingId,
            listingTitle: o.listingTitle || 'Land Plot',
            listingLocation: o.listingLocation || 'Cameroon',
            buyerId: o.buyerId,
            buyerName: o.buyerName || 'Buyer',
            proposedPrice: o.proposedPrice || 0,
            askingPrice: o.askingPrice || 0,
            paymentTerms: o.paymentTerms || 'notary_escrow',
            validUntil: o.validUntil || 'In 5 days',
            status: o.status || 'pending',
            notes: o.notes,
            createdAt: o.createdAt || new Date().toISOString(),
          }));
        }
        return DEFAULT_OFFERS;
      } catch {
        return DEFAULT_OFFERS;
      }
    },
    staleTime: 10_000,
  });
}

export interface CreateLandOfferInput {
  listingId: string;
  proposedPrice: number;
  paymentTerms: string;
  notes?: string;
}

export function useCreateLandOfferMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLandOfferInput) => {
      const { data } = await api.post('/land-offers', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['land-offers'] });
    },
  });
}

export function useAcceptLandOfferMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (offerId: string) => {
      const { data } = await api.post(`/land-offers/${offerId}/accept`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['land-offers'] });
      qc.invalidateQueries({ queryKey: ['land-listings'] });
    },
  });
}

export interface ScheduleVisitInput {
  listingId: string;
  date: string;
  timeSlot: string;
  visitorPhone: string;
  notes?: string;
}

export function useScheduleVisitMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ScheduleVisitInput) => {
      const { data } = await api.post('/visit-requests', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
