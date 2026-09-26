import { useThemedStyles } from "@/hooks/useTheme";
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

import AppIcon from '@/components/AppIcon';
import { formatDate } from '@/utils/format';

export default function DocumentDateField({
  value,
  onChange,
}: {
  value: Date | null;
  onChange: (date: Date | null) => void;
}) {
  const styles = useThemedStyles(baseStyles);
  const [showIos, setShowIos] = useState(false);
  const pickerValue = value ?? new Date();

  function open() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: pickerValue,
        mode: 'date',
        display: 'default',
        onValueChange: (_event, selectedDate) => onChange(selectedDate),
      });
      return;
    }
    setShowIos(true);
  }

  return (
    <View>
      <Pressable style={styles.box} onPress={open}>
        <View>
          <Text style={styles.caption}>Ngày khám / ngày tài liệu</Text>
          <Text style={[styles.value, !value && styles.placeholder]}>{value ? formatDate(value.toISOString()) : 'Chưa đặt ngày'}</Text>
        </View>
        <AppIcon ios="calendar" android="calendar_month" size={21} />
      </Pressable>
      <View style={styles.actions}>
        <Pressable style={styles.small} onPress={open}><Text style={styles.smallText}>Chọn ngày</Text></Pressable>
        <Pressable style={styles.small} onPress={() => onChange(new Date())}><Text style={styles.smallText}>Hôm nay</Text></Pressable>
        {value && <Pressable style={styles.small} onPress={() => onChange(null)}><Text style={styles.clearText}>Xóa ngày</Text></Pressable>}
      </View>
      {Platform.OS === 'ios' && showIos && (
        <View style={styles.iosPicker}>
          <DateTimePicker
            value={pickerValue}
            mode="date"
            display="compact"
            onValueChange={(_event, selectedDate) => onChange(selectedDate)}
            onDismiss={() => setShowIos(false)}
          />
          <Pressable onPress={() => setShowIos(false)}><Text style={styles.done}>Xong</Text></Pressable>
        </View>
      )}
    </View>
  );
}

const baseStyles = StyleSheet.create({
  box: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  caption: { fontSize: 10, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginTop: 4, textTransform: 'capitalize' },
  placeholder: { color: '#94A3B8' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  small: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99 },
  smallText: { color: '#2563EB', fontSize: 12, fontWeight: '800' },
  clearText: { color: '#DC2626', fontSize: 12, fontWeight: '800' },
  iosPicker: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  done: { color: '#2563EB', fontWeight: '900', padding: 8 },
});
