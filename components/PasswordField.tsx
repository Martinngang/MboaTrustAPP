import { forwardRef, useState } from 'react';
import { View, Pressable, TextInput, type TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { TextField } from './TextField';
import { useTheme } from '../theme/ThemeProvider';

interface PasswordFieldProps extends Omit<TextInputProps, 'secureTextEntry' | 'autoCapitalize' | 'value' | 'onChangeText'> {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  placeholder?: string;
  autoComplete?: 'current-password' | 'new-password';
}

// forwardRef + passthrough props (returnKeyType, onSubmitEditing,
// textContentType, blurOnSubmit, ...) so password fields can take part in
// "next field" keyboard chaining and submit-on-return like any other input —
// previously this component accepted a fixed, narrow prop list with no way
// to pass a ref or an onSubmitEditing handler at all, which meant every
// screen using it (Login, Signup, Reset Password) had no way to chain focus
// to/from it or submit the form from the keyboard's return key.
export const PasswordField = forwardRef<TextInput, PasswordFieldProps>(function PasswordField(
  { label, value, onChangeText, error, placeholder, autoComplete, ...rest },
  ref
) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <TextField
        ref={ref}
        label={label}
        value={value}
        onChangeText={onChangeText}
        error={error}
        placeholder={placeholder}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoComplete={autoComplete}
        {...rest}
        style={[{ paddingRight: 44 }, rest.style]}
      />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        hitSlop={8}
        style={{ position: 'absolute', right: 14, top: 34 }}
      >
        {visible ? <EyeOff size={18} color={colors.inkSubtle} /> : <Eye size={18} color={colors.inkSubtle} />}
      </Pressable>
    </View>
  );
});
