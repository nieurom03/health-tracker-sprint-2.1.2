import { useThemedStyles } from "@/hooks/useTheme";
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

import AppIcon from '@/components/AppIcon';
import { formatDate } from '@/utils/format';

function parseDate(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day, 12);
  return Number.isNaN(date.getTime()) ? null : date;
}

function serializeDate(date: Date) {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function PatientDateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const styles = useThemedStyles(baseStyles);
  const [showIos, setShowIos] = useState(false);
  const selected = parseDate(value);
  const pickerValue = selected ?? new Date(1990, 0, 1, 12);

  function open() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: pickerValue,
        mode: 'date',
        display: 'default',
        maximumDate: new Date(),
        onValueChange: (_event, date) => date && onChange(serializeDate(date)),
      });
      return;
    }
    setShowIos(true);
  }

  return <View>
    <Pressable style={styles.field} onPress={open} accessibilityRole="button" accessibilityLabel="Chọn ngày sinh">
      <Text style={[styles.value, !selected && styles.placeholder]}>{selected ? formatDate(value) : 'Chọn ngày sinh'}</Text>
      <AppIcon ios="calendar" android="calendar_month" size={20} />
    </Pressable>
    {Platform.OS === 'ios' && showIos && <View style={styles.pickerRow}>
      <DateTimePicker
        value={pickerValue}
        mode="date"
        display="compact"
        maximumDate={new Date()}
        locale="vi-VN"
        onValueChange={(_event, date) => date && onChange(serializeDate(date))}
      />
      <View style={styles.actions}>
        {!!selected && <Pressable onPress={() => onChange('')}><Text style={styles.clear}>Xóa ngày</Text></Pressable>}
        <Pressable onPress={() => setShowIos(false)}><Text style={styles.done}>Xong</Text></Pressable>
      </View>
    </View>}
  </View>;
}

const baseStyles = StyleSheet.create({
  field: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  value: { color: '#172033', fontSize: 16, textTransform: 'capitalize' },
  placeholder: { color: '#98A2B3' },
  pickerRow: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  clear: { color: '#DC2626', fontWeight: '700' },
  done: { color: '#2563EB', fontWeight: '900', paddingVertical: 8 },
});
