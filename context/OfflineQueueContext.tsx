import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchNetInfo, subscribeNetInfo } from '../utils/netInfoCompat';
import { useSubmitMilestoneEvidenceMutation } from '../api/contracts';
import { useSubmitVerificationReportMutation } from '../api/verifier';
import { uploadChatAttachment } from '../api/messagingUpload';

// Mobile port of MboaTrustFrontend/src/offlineQueue.tsx's OfflineQueueProvider.
// Two differences from web, both because the mobile evidence APIs already
// take local files directly instead of needing a serializable intermediate:
//  - queued items keep the picker's local file `uri` string as-is (no
//    data-URL round trip — RN keeps captured/picked photos as stable local
//    files, unlike a browser tab that can be closed and lose an object URL).
//  - persistence is a single JSON blob in AsyncStorage, not IndexedDB.
const STORAGE_KEY = 'mboatrust:offline-evidence-queue';

export type QueueStatus = 'pending_sync' | 'syncing' | 'failed';

interface BaseQueueItem {
  id: string;
  capturedAt: string;
  status: QueueStatus;
  syncAttempts: number;
  lastError?: string;
}

export interface QueuedMilestoneEvidence extends BaseQueueItem {
  kind: 'milestone_evidence';
  projectId: string;
  projectTitle: string;
  milestoneId: string;
  milestoneTitle: string;
  photoUri: string;
  fileName: string;
  mimeType: string;
  notes: string;
  geotagLat?: number;
  geotagLng?: number;
  placeName?: string;
}

export interface QueuedVerifierReport extends BaseQueueItem {
  kind: 'verifier_report';
  taskId: string;
  projectTitle: string;
  milestoneTitle: string;
  reportText: string;
  confirmedMatch: boolean;
  // A photo picked while offline is local-only (`remote: false`) and still
  // needs its upload-to-URL step at sync time; one picked while online was
  // already uploaded immediately by the screen, so it's just replayed as-is.
  photos: { uri: string; remote: boolean }[];
}

export type QueuedItem = QueuedMilestoneEvidence | QueuedVerifierReport;

type EnqueueMilestoneEvidenceInput = Omit<QueuedMilestoneEvidence, 'id' | 'capturedAt' | 'status' | 'syncAttempts'>;
type EnqueueVerifierReportInput = Omit<QueuedVerifierReport, 'id' | 'capturedAt' | 'status' | 'syncAttempts'>;

interface OfflineQueueContextValue {
  isOnline: boolean;
  queue: QueuedItem[];
  pendingCount: number;
  isSyncing: boolean;
  enqueueMilestoneEvidence: (input: EnqueueMilestoneEvidenceInput) => Promise<QueuedMilestoneEvidence>;
  enqueueVerifierReport: (input: EnqueueVerifierReportInput) => Promise<QueuedVerifierReport>;
  syncNow: () => Promise<void>;
}

const OfflineQueueContext = createContext<OfflineQueueContextValue>({} as OfflineQueueContextValue);

function newQueueId(): string {
  return `ev-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function loadQueue(): Promise<QueuedItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedItem[]) : [];
  } catch {
    return [];
  }
}

async function persistQueue(items: QueuedItem[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function OfflineQueueProvider({ children }: { children: ReactNode }) {
  const evidenceMutation = useSubmitMilestoneEvidenceMutation();
  const reportMutation = useSubmitVerificationReportMutation();
  // useMutation() returns a fresh object every render, so the mutateAsync
  // functions are read through refs instead of being syncNow's deps —
  // otherwise every render would recreate syncNow and retrigger every
  // effect below it.
  const evidenceMutateRef = useRef(evidenceMutation.mutateAsync);
  evidenceMutateRef.current = evidenceMutation.mutateAsync;
  const reportMutateRef = useRef(reportMutation.mutateAsync);
  reportMutateRef.current = reportMutation.mutateAsync;

  const [isOnline, setIsOnline] = useState(true);
  const [queue, setQueue] = useState<QueuedItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const queueRef = useRef<QueuedItem[]>([]);
  queueRef.current = queue;

  const setAndPersist = useCallback(async (items: QueuedItem[]) => {
    setQueue(items);
    await persistQueue(items);
  }, []);

  const refresh = useCallback(async () => {
    const items = await loadQueue();
    setQueue(items);
    return items;
  }, []);

  // Submits every pending/failed item to the real backend, one at a time.
  // A failure on one item records the real error and moves to the next
  // without losing the rest of the queue; an item is only removed after its
  // real submit call resolves, so an interrupted run (app killed, network
  // drop mid-loop) just leaves it queued for the next attempt.
  const syncNow = useCallback(async () => {
    const items = queueRef.current.filter((i) => i.status === 'pending_sync' || i.status === 'failed');
    if (items.length === 0) return;
    setIsSyncing(true);
    try {
      for (const item of items) {
        await setAndPersist(queueRef.current.map((q) => (q.id === item.id ? { ...q, status: 'syncing' as const } : q)));
        try {
          if (item.kind === 'milestone_evidence') {
            await evidenceMutateRef.current({
              projectId: item.projectId,
              milestoneId: item.milestoneId,
              file: { uri: item.photoUri, fileName: item.fileName, mimeType: item.mimeType },
              notes: item.notes,
              geotagLat: item.geotagLat,
              geotagLng: item.geotagLng,
              placeName: item.placeName,
            });
          } else {
            const uploadedUrls: string[] = [];
            for (const photo of item.photos) {
              if (photo.remote) {
                uploadedUrls.push(photo.uri);
              } else {
                const uploaded = await uploadChatAttachment({ uri: photo.uri });
                uploadedUrls.push(uploaded.url);
              }
            }
            await reportMutateRef.current({
              taskId: item.taskId,
              reportText: item.reportText,
              reportPhotos: uploadedUrls,
              confirmedMatch: item.confirmedMatch,
            });
          }
          await setAndPersist(queueRef.current.filter((q) => q.id !== item.id));
        } catch (err) {
          await setAndPersist(
            queueRef.current.map((q) =>
              q.id === item.id
                ? {
                    ...q,
                    status: 'failed' as const,
                    syncAttempts: q.syncAttempts + 1,
                    lastError: err instanceof Error ? err.message : 'Upload failed — will retry.',
                  }
                : q,
            ),
          );
        }
      }
    } finally {
      setIsSyncing(false);
    }
  }, [setAndPersist]);

  // Initial load, and attempt anything still queued from a previous session.
  useEffect(() => {
    refresh().then(async () => {
      const state = await fetchNetInfo();
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      if (online) syncNow();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real connectivity, not the hardcoded prop OfflineSyncBanner used to get.
  useEffect(() => {
    const unsubscribe = subscribeNetInfo((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline((wasOnline) => {
        if (!wasOnline && online) syncNow();
        return online;
      });
    });
    return unsubscribe;
  }, [syncNow]);

  // Coming back to the app (not just regaining network) is also worth a
  // sync attempt — e.g. connectivity returned while backgrounded.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state !== 'active') return;
      fetchNetInfo().then((s) => {
        if (s.isConnected && s.isInternetReachable !== false) syncNow();
      });
    });
    return () => sub.remove();
  }, [syncNow]);

  const enqueueMilestoneEvidence = useCallback(
    async (input: EnqueueMilestoneEvidenceInput) => {
      const item: QueuedMilestoneEvidence = { ...input, id: newQueueId(), capturedAt: new Date().toISOString(), status: 'pending_sync', syncAttempts: 0 };
      await setAndPersist([...queueRef.current, item]);
      if (isOnline) syncNow();
      return item;
    },
    [isOnline, syncNow, setAndPersist],
  );

  const enqueueVerifierReport = useCallback(
    async (input: EnqueueVerifierReportInput) => {
      const item: QueuedVerifierReport = { ...input, id: newQueueId(), capturedAt: new Date().toISOString(), status: 'pending_sync', syncAttempts: 0 };
      await setAndPersist([...queueRef.current, item]);
      if (isOnline) syncNow();
      return item;
    },
    [isOnline, syncNow, setAndPersist],
  );

  // Nothing lingers with a 'synced' status — a successful sync deletes the
  // item immediately (see syncNow above) — so everything still in `queue`
  // counts as pending.
  const pendingCount = queue.length;

  return (
    <OfflineQueueContext.Provider value={{ isOnline, queue, pendingCount, isSyncing, enqueueMilestoneEvidence, enqueueVerifierReport, syncNow }}>
      {children}
    </OfflineQueueContext.Provider>
  );
}

export const useOfflineQueue = () => useContext(OfflineQueueContext);
