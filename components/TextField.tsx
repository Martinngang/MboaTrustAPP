import { forwardRef, useState } from 'react';
import { View, Text, TextInput, type TextInputProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';

// Ported from the label/input pattern used throughout MboaTrustFrontend
// (e.g. Onboarding.tsx's phone field, CommunityScreens.tsx's GroupSetupScreen) —
// mono-uppercase label above a 2px-border rounded input that highlights forest
// green on focus. This is the one form primitive every screen with a text
// field should reuse instead of hand-rolling input styling per screen.
//
// forwardRef so multi-field forms can chain focus with `returnKeyType="next"`
// + `onSubmitEditing={() => nextRef.current?.focus()}` — previously this
// component couldn't be given a ref at all, so no form built on it could
// support "next field" keyboard chaining no matter what props a screen
// passed in.
export const TextField = forwardRef<TextInput, TextInputProps & { label?: string; error?: string; helperText?: string; containerStyle?: object }>(
  function TextField({ label, error, helperText, containerStyle, ...inputProps }, ref) {
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
          ref={ref}
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
);
