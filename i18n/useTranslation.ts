import { useApp } from '../context/AppContext';
import { translations, type TranslationKey } from './translations';

/**
 * The active language lives on AppContext (see AppContext.tsx's `language`/
 * `setLanguage`), not in a separate provider — it's account-scoped global UI
 * state exactly like `activeRole` already is, initialized from the real
 * `user.preferredLanguage` on login/refresh. SettingsScreen's language
 * toggle calls `setLanguage()` directly (in addition to persisting via
 * `useUpdatePreferredLanguageMutation`), so every screen using this hook
 * re-renders in the new language immediately — no app restart or refetch
 * needed for the switch to take visible effect.
 */
export function useTranslation() {
  const { language } = useApp();
  const t = (key: TranslationKey): string => translations[key][language];
  return { t, language };
}
