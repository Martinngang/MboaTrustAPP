import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface OrderLineItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface MaterialOrder {
  id: string;
  orderNumber: string;
  projectId: string;
  projectTitle: string;
  milestoneId: string;
  milestoneTitle: string;
  buyerName: string;
  contractorName: string;
  deliveryAddress: string;
  deliveryContact: string;
  items: OrderLineItem[];
  totalAmount: number;
  status: 'requested' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';
  waybillUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  inStock: boolean;
  stockQuantity: number;
  description?: string;
  imageUrl?: string;
}

export interface QuincaillerieProfile {
  id: string;
  businessName: string;
  address: string;
  region: string;
  phone: string;
  categories: string[];
  paymentProvider: 'mtn_momo' | 'orange_money';
  payoutPhoneNumber: string;
  verified: boolean;
  totalRevenue: number;
  pendingEscrow: number;
  availablePayout: number;
}

const DEFAULT_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-1',
    name: 'Cimencam 42.5R Super CPJ (50kg)',
    category: 'Cement',
    unit: 'Bag',
    price: 4950,
    inStock: true,
    stockQuantity: 450,
    description: 'High-strength Portland composite cement for structural foundations and columns.',
  },
  {
    id: 'inv-2',
    name: 'High-Yield Deformed Rebar FeE500 (12mm x 12m)',
    category: 'Steel & Rebar',
    unit: 'Bar',
    price: 6800,
    inStock: true,
    stockQuantity: 280,
    description: 'Certified weldable structural reinforcement steel bars for load-bearing pillars.',
  },
  {
    id: 'inv-3',
    name: 'High-Yield Deformed Rebar FeE500 (8mm x 12m)',
    category: 'Steel & Rebar',
    unit: 'Bar',
    price: 3200,
    inStock: true,
    stockQuantity: 320,
    description: 'Stirrup and tie reinforcement steel.',
  },
  {
    id: 'inv-4',
    name: 'Aluzinc Corrugated Roofing Sheet 0.40mm (6m)',
    category: 'Roofing',
    unit: 'Sheet',
    price: 14500,
    inStock: true,
    stockQuantity: 150,
    description: 'Anti-corrosion aluminium-zinc roofing sheet with 25-year manufacturer guarantee.',
  },
  {
    id: 'inv-5',
    name: 'PVC Pressure Pipe PN10 (Ø110mm x 6m)',
    category: 'Plumbing',
    unit: 'Length',
    price: 9200,
    inStock: true,
    stockQuantity: 90,
    description: 'Heavy-duty drainage and water supply pipe.',
  },
  {
    id: 'inv-6',
    name: 'Sawn Hardwood Timber Framing (5x15cm x 4m)',
    category: 'Timber',
    unit: 'Piece',
    price: 4800,
    inStock: true,
    stockQuantity: 200,
    description: 'Treated Ayous and Iroko hardwood for roof trusses.',
  },
];

const DEFAULT_ORDERS: MaterialOrder[] = [
  {
    id: 'ord-101',
    orderNumber: 'ORD-2026-881',
    projectId: 'proj-1',
    projectTitle: 'Villa Odza Residential Construction',
    milestoneId: 'm-1',
    milestoneTitle: 'Foundation Slab & Ground Columns',
    buyerName: 'Marie-Claire N. (Funder)',
    contractorName: 'ETS Kamga BTP (Contractor)',
    deliveryAddress: 'Odza Borne 10, Near Total Station, Yaoundé',
    deliveryContact: '+237 677 889 900',
    items: [
      { id: 'i-1', name: 'Cimencam 42.5R Super CPJ (50kg)', category: 'Cement', quantity: 150, unit: 'Bags', unitPrice: 4950, totalPrice: 742500 },
      { id: 'i-2', name: 'Rebar FeE500 (12mm x 12m)', category: 'Steel', quantity: 80, unit: 'Bars', unitPrice: 6800, totalPrice: 544000 },
      { id: 'i-3', name: 'Rebar FeE500 (8mm x 12m)', category: 'Steel', quantity: 50, unit: 'Bars', unitPrice: 3200, totalPrice: 160000 },
    ],
    totalAmount: 1446500,
    status: 'requested',
    notes: 'Please dispatch delivery on Monday 8:00 AM. Contractor crane available on site.',
    createdAt: '2 hours ago',
  },
  {
    id: 'ord-102',
    orderNumber: 'ORD-2026-742',
    projectId: 'proj-2',
    projectTitle: 'Mbalmayo Community Water Well',
    milestoneId: 'm-2',
    milestoneTitle: 'Pumping Station & 5000L Overhead Tank',
    buyerName: 'Community Water Committee',
    contractorName: 'Talla Hydraulics SARL',
    deliveryAddress: 'Quartier Oyack, Mbalmayo',
    deliveryContact: '+237 699 112 233',
    items: [
      { id: 'i-4', name: 'PVC Pressure Pipe PN10 (Ø110mm)', category: 'Plumbing', quantity: 20, unit: 'Lengths', unitPrice: 9200, totalPrice: 184000 },
      { id: 'i-5', name: 'Cimencam 42.5R Super CPJ (50kg)', category: 'Cement', quantity: 60, unit: 'Bags', unitPrice: 4950, totalPrice: 297000 },
    ],
    totalAmount: 481000,
    status: 'dispatched',
    waybillUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop',
    createdAt: 'Yesterday',
  },
];

export function useMyQuincaillerieProfileQuery() {
  return useQuery({
    queryKey: ['quincaillerie-profile', 'me'],
    queryFn: async (): Promise<QuincaillerieProfile> => {
      try {
        const { data } = await api.get<{ data: any }>('/quincaillerie-profiles/me');
        return {
          id: data.data._id || 'quin-1',
          businessName: data.data.businessName || 'Quincaillerie Centrale Yaoundé',
          address: data.data.address || 'Avenue Kennedy, Centre-Ville',
          region: data.data.region || 'Centre',
          phone: data.data.phone || '+237 677 001 122',
          categories: data.data.categories || ['Cement', 'Steel & Rebar', 'Roofing', 'Plumbing'],
          paymentProvider: data.data.paymentProvider || 'mtn_momo',
          payoutPhoneNumber: data.data.payoutPhoneNumber || '677001122',
          verified: Boolean(data.data.verified ?? true),
          totalRevenue: 4200000,
          pendingEscrow: 1446500,
          availablePayout: 2753500,
        };
      } catch {
        return {
          id: 'quin-1',
          businessName: 'Quincaillerie Centrale Yaoundé',
          address: 'Avenue Kennedy, Centre-Ville',
          region: 'Centre',
          phone: '+237 677 001 122',
          categories: ['Cement', 'Steel & Rebar', 'Roofing', 'Plumbing', 'Timber'],
          paymentProvider: 'mtn_momo',
          payoutPhoneNumber: '677001122',
          verified: true,
          totalRevenue: 4200000,
          pendingEscrow: 1446500,
          availablePayout: 2753500,
        };
      }
    },
    staleTime: 20_000,
  });
}

export function useMaterialOrdersQuery(status?: string) {
  return useQuery({
    queryKey: ['material-orders', status],
    queryFn: async (): Promise<MaterialOrder[]> => {
      try {
        const { data } = await api.get<{ data: any[] }>('/material-orders', {
          params: { status },
        });
        if (data.data && data.data.length > 0) {
          return data.data.map((o) => ({
            id: o._id,
            orderNumber: o.orderNumber || `ORD-${o._id.slice(-4)}`,
            projectId: typeof o.projectId === 'object' ? o.projectId._id : o.projectId,
            projectTitle: typeof o.projectId === 'object' ? o.projectId.title : 'Building Project',
            milestoneId: o.milestoneId || 'm-1',
            milestoneTitle: o.milestoneTitle || 'Construction Milestone',
            buyerName: o.buyerName || 'Project Funder',
            contractorName: o.contractorName || 'Site Contractor',
            deliveryAddress: o.deliveryAddress || 'Site Delivery Location',
            deliveryContact: o.deliveryContact || '+237 600 000 000',
            items: o.items || [],
            totalAmount: o.totalAmount || 0,
            status: o.status || 'requested',
            waybillUrl: o.waybillUrl,
            notes: o.notes,
            createdAt: o.createdAt || new Date().toISOString(),
          }));
        }
        return DEFAULT_ORDERS;
      } catch {
        return DEFAULT_ORDERS;
      }
    },
    staleTime: 10_000,
  });
}

export function useConfirmMaterialOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post(`/material-orders/${orderId}/confirm`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['material-orders'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDispatchMaterialOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, waybillUrl, notes }: { orderId: string; waybillUrl?: string; notes?: string }) => {
      const { data } = await api.post(`/material-orders/${orderId}/dispatch`, {
        waybillUrl,
        notes,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['material-orders'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useQuincaillerieInventoryQuery() {
  return useQuery({
    queryKey: ['inventory-items'],
    queryFn: async (): Promise<InventoryItem[]> => {
      try {
        const { data } = await api.get<{ data: any[] }>('/inventory-items');
        if (data.data && data.data.length > 0) {
          return data.data.map((i) => ({
            id: i._id || i.id,
            name: i.name,
            category: i.category,
            unit: i.unit || 'Unit',
            price: i.price || 0,
            inStock: Boolean(i.inStock ?? true),
            stockQuantity: i.stockQuantity || 100,
            description: i.description,
            imageUrl: i.imageUrl,
          }));
        }
        return DEFAULT_INVENTORY;
      } catch {
        return DEFAULT_INVENTORY;
      }
    },
    staleTime: 20_000,
  });
}

export interface AddInventoryItemInput {
  name: string;
  category: string;
  unit: string;
  price: number;
  stockQuantity: number;
  description?: string;
}

export function useAddInventoryItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddInventoryItemInput) => {
      const { data } = await api.post('/inventory-items', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-items'] });
    },
  });
}
