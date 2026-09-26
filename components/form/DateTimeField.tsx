import { useThemedStyles } from "@/hooks/useTheme";
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerChangeEvent,
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import AppIcon from '@/components/AppIcon';
import { formatDateTime } from '@/utils/format';

type PickerMode = 'date' | 'time';

export default function DateTimeField({
  value,
  onChange,
}: {
  value: Date;
  onChange: (date: Date) => void;
}) {
  const styles = useThemedStyles(baseStyles);
  const [iosMode, setIosMode] = useState<PickerMode | null>(null);

  const updatePart = (mode: PickerMode, selected: Date) => {
    const next = new Date(value);

    if (mode === 'date') {
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    } else {
      next.setHours(selected.getHours(), selected.getMinutes(), selected.getSeconds(), 0);
    }

    onChange(next);
  };

  const openPicker = (mode: PickerMode) => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode,
        is24Hour: true,
        display: 'default',
        onValueChange: (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
          updatePart(mode, selectedDate);
        },
      });
      return;
    }

    setIosMode(mode);
  };

  return (
    <View>
      <Pressable style={styles.box} onPress={() => openPicker('date')}>
        <View>
          <Text style={styles.caption}>Ngày & giờ đo</Text>
          <Text style={styles.value}>{formatDateTime(value.toISOString())}</Text>
        </View>
        <AppIcon ios="calendar" android="calendar_month" size={22} />
      </Pressable>

      <View style={styles.actions}>
        <Pressable style={styles.small} onPress={() => openPicker('date')}>
          <Text style={styles.smallText}>Chọn ngày</Text>
        </Pressable>
        <Pressable style={styles.small} onPress={() => openPicker('time')}>
          <Text style={styles.smallText}>Chọn giờ</Text>
        </Pressable>
        <Pressable style={styles.small} onPress={() => onChange(new Date())}>
          <Text style={styles.smallText}>Bây giờ</Text>
        </Pressable>
      </View>

      {Platform.OS === 'ios' && iosMode && (
        <View style={styles.iosPickerWrap}>
          <DateTimePicker
            value={value}
            mode={iosMode}
            display="compact"
            onValueChange={(_event, selectedDate) => updatePart(iosMode, selectedDate)}
            onDismiss={() => setIosMode(null)}
          />
          <Pressable style={styles.done} onPress={() => setIosMode(null)}>
            <Text style={styles.doneText}>Xong</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const baseStyles = StyleSheet.create({
  box: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  caption: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  small: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99 },
  smallText: { fontSize: 12, fontWeight: '800', color: '#2563EB' },
  iosPickerWrap: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  done: { paddingHorizontal: 12, paddingVertical: 8 },
  doneText: { color: '#2563EB', fontWeight: '900' },
});
