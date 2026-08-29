import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { TextField } from './TextField';
import { useTheme } from '../theme/ThemeProvider';

export function PasswordField({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  placeholder?: string;
  autoComplete?: 'current-password' | 'new-password';
}) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <TextField
        label={label}
        value={value}
        onChangeText={onChangeText}
        error={error}
        placeholder={placeholder}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoComplete={autoComplete}
        style={{ paddingRight: 44 }}
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
}
