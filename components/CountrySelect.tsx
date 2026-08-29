import { useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { ChevronDown, Search } from 'lucide-react-native';
import { Modal } from './Modal';
import { TextField } from './TextField';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';

// Backend requires residenceCountry as a strict ISO 3166-1 alpha-2 code (see
// userValidators.js) — free text would fail validation, so this is a real
// picker, not a text field. Web's CountryCitySelect draws from a full
// country-state-city package; this is a curated list (Cameroon + the
// diaspora's main destination countries) rather than pulling in that whole
// dataset for a mobile bundle — sufficient for the app's actual audience,
// extendable later without changing the field's contract (still just an
// ISO code string).
export const COUNTRIES = [
  { code: 'CM', name: 'Cameroon' },
  { code: 'FR', name: 'France' },
  { code: 'BE', name: 'Belgium' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'IT', name: 'Italy' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'GA', name: 'Gabon' },
  { code: 'TD', name: 'Chad' },
] as const;

export function CountrySelect({ value, onChange, error, label = 'Country' }: { value: string; onChange: (code: string) => void; error?: string; label?: string }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = COUNTRIES.find((c) => c.code === value);
  const filtered = COUNTRIES.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <View>
      {label && (
        <Text style={{ fontFamily: FONT.mono, color: colors.inkSubtle, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          {label}
        </Text>
      )}
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        style={{
          borderWidth: 2,
          borderColor: error ? colors.seal : colors.parchmentDark,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: colors.surface,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontFamily: FONT.sans, fontSize: 14, color: selected ? colors.ink : colors.inkSubtle }}>
          {selected ? selected.name : 'Select your country'}
        </Text>
        <ChevronDown size={16} color={colors.inkSubtle} />
      </Pressable>
      {error && <Text style={{ fontFamily: FONT.sans, fontSize: 11, marginTop: 4, color: colors.seal }}>{error}</Text>}

      <Modal visible={open} onClose={() => setOpen(false)} placement="bottom" style={{ maxHeight: '75%' }}>
        <View style={{ gap: 12 }}>
          <Text style={{ fontFamily: FONT.serifBold, color: colors.ink, fontSize: 17 }}>Select country</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.parchmentDark, borderRadius: 12, paddingHorizontal: 12 }}>
            <Search size={14} color={colors.inkSubtle} />
            <TextField value={query} onChangeText={setQuery} placeholder="Search…" containerStyle={{ flex: 1 }} style={{ borderWidth: 0, paddingHorizontal: 0 }} />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            style={{ maxHeight: 320 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item.code);
                  setOpen(false);
                  setQuery('');
                }}
                accessibilityRole="button"
                style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.parchmentDark }}
              >
                <Text style={{ fontFamily: FONT.sans, color: colors.ink, fontSize: 14 }}>{item.name}</Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}
