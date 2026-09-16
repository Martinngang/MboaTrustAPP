import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { X, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';
import { useMyKycStatusQuery } from '../api/kyc';

interface ChecklistItem {
  id: string;
  label: string;
  route: string;
}

const ITEMS_BY_ROLE: Record<string, ChecklistItem> = {
  funder: { id: 'explore', label: 'Browse fundable projects', route: 'Projects' },
  contractor: { id: 'explore', label: 'Browse open tenders', route: 'Jobs' },
  seller: { id: 'explore', label: 'List your first property', route: 'CreateListing' },
  quincaillerie: { id: 'explore', label: 'Set up your inventory', route: 'InventoryCatalog' },
  verifier: { id: 'explore', label: 'Check your task queue', route: 'VerifierTasks' },
};

// Ported from MboaTrustFrontend/src/components/dashboard/OnboardingChecklistWidget.tsx —
// same dismissible "Get set up" first-login checklist (real KYC status +
// two self-reported steps), persisted with AsyncStorage instead of
// localStorage. Web has no `mainTabs` route names for payout methods, so
// that step routes to the same PayoutMethods screen mobile already has.
export function OnboardingChecklistWidget({ role }: { role: string }) {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { data: kycStatus = 'unverified' } = useMyKycStatusQuery();
  const storageKey = `mboatrust-onboarding-checklist:${role}`;
  const [dismissed, setDismissed] = useState(false);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(storageKey).then((raw) => {
      if (cancelled) return;
      try {
        const stored = raw ? JSON.parse(raw) : null;
        if (stored?.dismissed) setDismissed(true);
        if (Array.isArray(stored?.done)) setDone(new Set(stored.done));
      } catch {
        /* ignore */
      }
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  const roleItem = ITEMS_BY_ROLE[role] ?? ITEMS_BY_ROLE.funder;
  const items: ChecklistItem[] = [
    { id: 'kyc', label: 'Verify your identity', route: 'Kyc' },
    { id: 'payout', label: 'Link MoMo or Orange Money', route: 'PayoutMethods' },
    roleItem,
  ];
  const isDone = (id: string) => (id === 'kyc' ? kycStatus === 'verified' : done.has(id));
  const doneCount = items.filter((it) => isDone(it.id)).length;

  const persist = (nextDone: Set<string>, nextDismissed: boolean) => {
    AsyncStorage.setItem(storageKey, JSON.stringify({ done: [...nextDone], dismissed: nextDismissed })).catch(() => {});
  };

  const markDone = (item: ChecklistItem) => {
    if (item.id !== 'kyc') {
      const next = new Set(done);
      next.add(item.id);
      setDone(next);
      persist(next, dismissed);
    }
    navigation.navigate(item.route);
  };

  const dismiss = () => {
    setDismissed(true);
    persist(done, true);
  };

  if (!loaded || dismissed || doneCount === items.length) return null;

  return (
    <View style={{ borderRadius: 18, borderWidth: 1, borderColor: colors.parchmentDark, backgroundColor: colors.surface, padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <View>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 14 }}>Get set up</Text>
          <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
            {doneCount} of {items.length} complete
          </Text>
        </View>
        <Pressable onPress={dismiss} accessibilityRole="button" accessibilityLabel="Dismiss checklist" hitSlop={8}>
          <X size={16} color={colors.inkSubtle} />
        </Pressable>
      </View>

      <View style={{ gap: 4 }}>
        {items.map((it) => {
          const complete = isDone(it.id);
          return (
            <Pressable
              key={it.id}
              onPress={() => !complete && markDone(it)}
              disabled={complete}
              accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, paddingHorizontal: 4 }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: complete ? colors.forest : 'transparent',
                  borderWidth: complete ? 0 : 1.5,
                  borderColor: colors.parchmentDark,
                }}
              >
                {complete && <Check size={11} color="#fff" />}
              </View>
              <Text
                style={{
                  fontFamily: FONT.sans,
                  fontSize: 13,
                  color: complete ? colors.inkSubtle : colors.ink,
                  textDecorationLine: complete ? 'line-through' : 'none',
                }}
              >
                {it.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
