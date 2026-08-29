import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface Participant {
  id: string;
  fullName: string;
  avatarUrl?: string;
  role?: string;
}

export interface Conversation {
  id: string;
  contextType: 'project' | 'bid' | 'land_listing' | 'direct';
  contextId?: string;
  title: string;
  withName: string;
  withRole: string;
  avatarInitial: string;
  avatarUrl?: string;
  unreadCount: number;
  lastMessageText: string;
  lastMessageTime: string;
  participantIds: Participant[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  from: 'me' | 'them';
  senderName: string;
  senderAvatar?: string;
  text: string;
  imageUrl?: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

const DEFAULT_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    contextType: 'project',
    contextId: 'proj-1',
    title: 'Villa Odza Residential Construction',
    withName: 'ETS Kamga BTP (Contractor)',
    withRole: 'Contractor',
    avatarInitial: 'K',
    unreadCount: 1,
    lastMessageText: 'Foundation concrete pour has been completed and verified with site photos.',
    lastMessageTime: '10:45 AM',
    participantIds: [
      { id: 'usr-1', fullName: 'Marie-Claire (Funder)', role: 'funder' },
      { id: 'usr-2', fullName: 'Jean-Paul Kamga (Contractor)', role: 'contractor' },
    ],
  },
  {
    id: 'conv-2',
    contextType: 'land_listing',
    contextId: 'land-1',
    title: '1,200 m² Prime Coastal Plot Kribi',
    withName: 'Jean-Pierre Eboa (Seller)',
    withRole: 'Landowner',
    avatarInitial: 'E',
    unreadCount: 0,
    lastMessageText: 'The cadastral boundary markers are clearly visible on the perimeter.',
    lastMessageTime: 'Yesterday',
    participantIds: [
      { id: 'usr-1', fullName: 'Marie-Claire (Funder)', role: 'funder' },
      { id: 'usr-3', fullName: 'Jean-Pierre Eboa (Seller)', role: 'seller' },
    ],
  },
  {
    id: 'conv-3',
    contextType: 'direct',
    title: 'Quincaillerie Centrale Yaoundé',
    withName: 'Quincaillerie Centrale',
    withRole: 'Supplier',
    avatarInitial: 'Q',
    unreadCount: 0,
    lastMessageText: '150 bags of Cimencam 42.5R dispatched via truck #WB-881.',
    lastMessageTime: 'Aug 26',
    participantIds: [
      { id: 'usr-1', fullName: 'Marie-Claire (Funder)', role: 'funder' },
      { id: 'usr-4', fullName: 'Store Manager', role: 'quincaillerie' },
    ],
  },
];

const DEFAULT_MESSAGES: Record<string, ChatMessage[]> = {
  'conv-1': [
    {
      id: 'm-1',
      conversationId: 'conv-1',
      from: 'me',
      senderName: 'Marie-Claire',
      text: 'Hello Jean-Paul, how is the excavation progressing on the Odza site?',
      timestamp: '10:30 AM',
      status: 'read',
    },
    {
      id: 'm-2',
      conversationId: 'conv-1',
      from: 'them',
      senderName: 'Jean-Paul Kamga',
      text: 'Good morning Madame. Excavation reached 1.5m depth yesterday. Rebar cages are assembled.',
      timestamp: '10:35 AM',
      status: 'read',
    },
    {
      id: 'm-3',
      conversationId: 'conv-1',
      from: 'them',
      senderName: 'Jean-Paul Kamga',
      text: 'Foundation concrete pour has been completed and verified with site photos.',
      imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=400&fit=crop',
      timestamp: '10:45 AM',
      status: 'delivered',
    },
  ],
  'conv-2': [
    {
      id: 'm-4',
      conversationId: 'conv-2',
      from: 'me',
      senderName: 'Marie-Claire',
      text: 'Hello, is the Titre Foncier #8812/Oce directly transferable at the notary?',
      timestamp: 'Yesterday',
      status: 'read',
    },
    {
      id: 'm-5',
      conversationId: 'conv-2',
      from: 'them',
      senderName: 'Jean-Pierre Eboa',
      text: 'Yes absolutely. The cadastral boundary markers are clearly visible on the perimeter.',
      timestamp: 'Yesterday',
      status: 'read',
    },
  ],
};

export function useConversationsQuery() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async (): Promise<Conversation[]> => {
      try {
        const { data } = await api.get<{ data: any[] }>('/conversations');
        if (data.data && data.data.length > 0) {
          return data.data.map((c) => ({
            id: c._id || c.id,
            contextType: c.contextType || 'direct',
            contextId: c.contextId,
            title: c.title || 'Conversation',
            withName: c.participantIds?.[0]?.fullName || 'Chat Partner',
            withRole: c.contextType || 'Direct',
            avatarInitial: (c.participantIds?.[0]?.fullName || 'C')[0],
            avatarUrl: c.avatarUrl,
            unreadCount: c.unreadCount || 0,
            lastMessageText: c.lastMessage?.body || 'No messages yet',
            lastMessageTime: 'Recent',
            participantIds: (c.participantIds || []).map((p: any) => ({
              id: p._id || p.id,
              fullName: p.fullName || 'User',
              avatarUrl: p.avatarUrl,
            })),
          }));
        }
        return DEFAULT_CONVERSATIONS;
      } catch {
        return DEFAULT_CONVERSATIONS;
      }
    },
    staleTime: 10_000,
  });
}

export function useMessagesQuery(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async (): Promise<ChatMessage[]> => {
      try {
        const { data } = await api.get<{ data: any[] }>(`/conversations/${conversationId}/messages`);
        if (data.data && data.data.length > 0) {
          return data.data.map((m) => ({
            id: m._id || m.id,
            conversationId,
            from: m.senderId === 'me' ? 'me' : 'them',
            senderName: typeof m.senderId === 'object' ? m.senderId.fullName : 'Participant',
            text: m.body || '',
            imageUrl: m.attachments?.[0]?.url,
            timestamp: new Date(m.sentAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'delivered',
          }));
        }
        return DEFAULT_MESSAGES[conversationId] || DEFAULT_MESSAGES['conv-1'];
      } catch {
        return DEFAULT_MESSAGES[conversationId] || DEFAULT_MESSAGES['conv-1'];
      }
    },
    enabled: !!conversationId,
    staleTime: 5_000,
  });
}

export function useSendMessageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, text, imageUrl }: { conversationId: string; text: string; imageUrl?: string }) => {
      const { data } = await api.post(`/conversations/${conversationId}/messages`, {
        body: text,
        attachments: imageUrl ? [{ url: imageUrl, type: 'image', mimeType: 'image/jpeg' }] : [],
      });
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['messages', vars.conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
