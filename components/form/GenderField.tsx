import { useThemedStyles } from "@/hooks/useTheme";
import { ActionSheetIOS, Alert, Platform, Pressable, StyleSheet, Text } from 'react-native';
import AppIcon from '@/components/AppIcon';

const choices = ['Nam', 'Nữ', 'Khác'];

export default function GenderField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const styles = useThemedStyles(baseStyles);
  function open() {
    if (Platform.OS === 'ios') {
      const options = ['Hủy', ...choices, ...(value ? ['Xóa lựa chọn'] : [])];
      ActionSheetIOS.showActionSheetWithOptions(
        { title: 'Chọn giới tính', options, cancelButtonIndex: 0, destructiveButtonIndex: value ? options.length - 1 : undefined },
        index => {
          if (index >= 1 && index <= choices.length) onChange(choices[index - 1]);
          else if (value && index === options.length - 1) onChange('');
        },
      );
      return;
    }
    Alert.alert('Chọn giới tính', undefined, [
      ...choices.map(choice => ({ text: choice, onPress: () => onChange(choice) })),
      ...(value ? [{ text: 'Xóa lựa chọn', style: 'destructive' as const, onPress: () => onChange('') }] : []),
      { text: 'Hủy', style: 'cancel' },
    ]);
  }

  return <Pressable style={styles.field} onPress={open} accessibilityRole="button" accessibilityLabel="Chọn giới tính">
    <Text style={[styles.value, !value && styles.placeholder]}>{value || 'Chọn giới tính'}</Text>
    <AppIcon ios="chevron.down" android="keyboard_arrow_down" size={16} color="#667085" />
  </Pressable>;
}

const baseStyles = StyleSheet.create({
  field: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  value: { color: '#172033', fontSize: 16 },
  placeholder: { color: '#98A2B3' },
});
