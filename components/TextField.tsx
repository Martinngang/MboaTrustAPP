import { useState } from 'react';
import { View, Text, TextInput, type TextInputProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';

// Ported from the label/input pattern used throughout MboaTrustFrontend
// (e.g. Onboarding.tsx's phone field, CommunityScreens.tsx's GroupSetupScreen) —
// mono-uppercase label above a 2px-border rounded input that highlights forest
// green on focus. This is the one form primitive every screen with a text
// field should reuse instead of hand-rolling input styling per screen.
export function TextField({
  label,
  error,
  helperText,
  containerStyle,
  ...inputProps
}: TextInputProps & { label?: string; error?: string; helperText?: string; containerStyle?: object }) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.seal : focused ? colors.forest : colors.parchmentDark;

  return (
    <View style={containerStyle}>
      {label && (
        <Text
          style={{
            fontFamily: FONT.mono,
            color: colors.inkSubtle,
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        {...inputProps}
        onFocus={(e) => {
          setFocused(true);
          inputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          inputProps.onBlur?.(e);
        }}
        placeholderTextColor={colors.inkSubtle}
        style={[
          {
            borderWidth: 2,
            borderColor,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontFamily: FONT.sans,
            fontSize: 14,
            color: colors.ink,
            backgroundColor: colors.surface,
          },
          inputProps.style,
        ]}
      />
      {(error || helperText) && (
        <Text style={{ fontFamily: FONT.sans, fontSize: 11, marginTop: 4, color: error ? colors.seal : colors.inkSubtle }}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}
