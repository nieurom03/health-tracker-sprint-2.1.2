import { useThemedStyles } from "@/hooks/useTheme";
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import DateTimeField from './DateTimeField';
import { addLab, addVital, deleteMetric, LAB_TYPES, updateMetric, VITAL_TYPES } from '@/database/repositories/metricRepository';
import type { MetricPoint, MetricSource } from '@/types/health';

type Props = { patientId: number; initial?: MetricPoint | null };
type MetricChoice = { key: string; name: string; unit: string; placeholder: string; placeholder2?: string; hasSecond?: boolean; icon?: string };

export default function MetricForm({ patientId, initial }: Props) {
  const styles = useThemedStyles(baseStyles);
  const db = useSQLiteContext();
  const editing = !!initial;
  const [mode, setMode] = useState<MetricSource>(initial?.source ?? 'vital');
  const choices: readonly MetricChoice[] = mode === 'vital' ? VITAL_TYPES : LAB_TYPES;
  const [key, setKey] = useState(initial?.metric_key ?? choices[0].key);
  const [v1, setV1] = useState(initial ? String(initial.value) : '');
  const [v2, setV2] = useState(initial?.value2 != null ? String(initial.value2) : '');
  const [date, setDate] = useState(initial ? new Date(initial.measured_at) : new Date());
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const selected = useMemo(() => choices.find(x => x.key === key) ?? choices[0], [choices, key]);

  function switchMode(next: MetricSource) {
    if (editing) return;
    setMode(next);
    const first = next === 'vital' ? VITAL_TYPES[0] : LAB_TYPES[0];
    setKey(first.key); setV1(''); setV2('');
  }

  async function save() {
    const n1 = Number(v1.replace(',', '.'));
    const n2 = v2 ? Number(v2.replace(',', '.')) : undefined;
    if (!patientId || !Number.isFinite(n1)) return Alert.alert('Dữ liệu chưa hợp lệ', 'Hãy nhập giá trị hợp lệ.');
    const hasSecond = mode === 'vital' && 'hasSecond' in selected && selected.hasSecond;
    if (hasSecond && !Number.isFinite(n2)) return Alert.alert('Thiếu giá trị', 'Huyết áp cần đủ tâm thu và tâm trương.');
    if (editing && initial) {
      await updateMetric(db, initial.source, initial.id, { value: n1, value2: n2, measuredAt: date.toISOString(), notes });
    } else if (mode === 'vital') {
      const x = selected;
      await addVital(db, { patientId, type: x.key, value1: n1, value2: n2, unit: x.unit, measuredAt: date.toISOString(), notes });
    } else {
      const x = selected;
      await addLab(db, { patientId, testCode: x.key, testName: x.name, value: n1, unit: x.unit, testedAt: date.toISOString(), notes });
    }
    router.back();
  }

  function remove() {
    if (!initial) return;
    Alert.alert('Xóa chỉ số?', `${initial.metric_name} ${initial.value2 != null ? `${initial.value}/${initial.value2}` : initial.value} ${initial.unit} sẽ bị xóa khỏi máy.`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => { await deleteMetric(db, initial.source, initial.id); router.back(); } }
    ]);
  }

  return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}><Text style={styles.heroEyebrow}>{editing ? 'CHỈNH SỬA' : 'GHI NHẬN MỚI'}</Text><Text style={styles.heroTitle}>{editing ? initial?.metric_name : 'Chỉ số sức khỏe'}</Text><Text style={styles.heroText}>Dữ liệu được lưu nội bộ trên thiết bị.</Text></View>
      {!editing && <View style={styles.segment}>
        <Pressable style={[styles.seg, mode === 'vital' && styles.segActive]} onPress={() => switchMode('vital')}><Text style={[styles.segText, mode === 'vital' && styles.segTextActive]}>Sinh hiệu</Text></Pressable>
        <Pressable style={[styles.seg, mode === 'lab' && styles.segActive]} onPress={() => switchMode('lab')}><Text style={[styles.segText, mode === 'lab' && styles.segTextActive]}>Xét nghiệm</Text></Pressable>
      </View>}
      <Text style={styles.label}>Loại chỉ số</Text>
      <View style={styles.chips}>{choices.map(x => <Pressable disabled={editing} key={x.key} style={[styles.chip, key === x.key && styles.chipActive, editing && key !== x.key && styles.chipDisabled]} onPress={() => { setKey(x.key); setV1(''); setV2(''); }}><Text style={[styles.chipText, key === x.key && styles.chipTextActive]}>{x.name}</Text></Pressable>)}</View>
      <Text style={styles.label}>Giá trị</Text>
      <View style={styles.valueCard}><View style={styles.valueRow}><TextInput style={styles.valueInput} keyboardType="decimal-pad" value={v1} onChangeText={setV1} placeholder={selected.placeholder}/>{mode === 'vital' && 'hasSecond' in selected && selected.hasSecond && <><Text style={styles.slash}>/</Text><TextInput style={styles.valueInput} keyboardType="decimal-pad" value={v2} onChangeText={setV2} placeholder={selected.placeholder2}/></>}<Text style={styles.unit}>{selected.unit}</Text></View></View>
      <Text style={styles.label}>Thời điểm</Text><DateTimeField value={date} onChange={setDate}/>
      {editing && initial?.source === 'lab' && (initial.document_name || initial.source_line) && <View style={styles.sourceCard}>
        <Text style={styles.sourceTitle}>NGUỒN CHỈ SỐ</Text>
        {initial.document_name && <Text style={styles.sourceText}>Tài liệu: {initial.document_name}</Text>}
        {initial.reference_text && <Text style={styles.sourceText}>Tham chiếu: {initial.reference_text}</Text>}
        {initial.source_line && <Text style={styles.sourceLine}>Dòng OCR: {initial.source_line}</Text>}
      </View>}
      <Text style={styles.label}>Ghi chú</Text><TextInput style={styles.notes} multiline value={notes} onChangeText={setNotes} placeholder="Ví dụ: đo sau ăn 2 giờ, vừa vận động..."/>
      <Pressable style={styles.primary} onPress={save}><Text style={styles.primaryText}>{editing ? 'Lưu thay đổi' : 'Lưu chỉ số'}</Text></Pressable>
      {editing && <Pressable style={styles.delete} onPress={remove}><Text style={styles.deleteText}>Xóa chỉ số này</Text></Pressable>}
    </ScrollView>
  </KeyboardAvoidingView>;
}

const baseStyles = StyleSheet.create({
  container:{padding:18,paddingBottom:44,gap:10,backgroundColor:'#F8FAFC',minHeight:'100%'}, hero:{backgroundColor:'#0F172A',borderRadius:24,padding:20,marginBottom:4},heroEyebrow:{fontSize:11,fontWeight:'900',letterSpacing:1,color:'#93C5FD'},heroTitle:{fontSize:25,fontWeight:'900',color:'#fff',marginTop:5},heroText:{fontSize:12,color:'#CBD5E1',marginTop:5},
  segment:{flexDirection:'row',backgroundColor:'#E2E8F0',borderRadius:15,padding:4},seg:{flex:1,padding:11,alignItems:'center',borderRadius:12},segActive:{backgroundColor:'#fff'},segText:{fontWeight:'800',color:'#64748B'},segTextActive:{color:'#0F172A'},
  label:{fontSize:12,fontWeight:'900',color:'#475569',marginTop:10,textTransform:'uppercase',letterSpacing:.5},chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{paddingHorizontal:13,paddingVertical:10,borderRadius:99,backgroundColor:'#fff',borderWidth:1,borderColor:'#E2E8F0'},chipActive:{backgroundColor:'#2563EB',borderColor:'#2563EB'},chipDisabled:{opacity:.35},chipText:{fontSize:12,fontWeight:'800',color:'#475569'},chipTextActive:{color:'#fff'},
  valueCard:{backgroundColor:'#fff',borderWidth:1,borderColor:'#E2E8F0',borderRadius:18,padding:14},valueRow:{flexDirection:'row',alignItems:'center',gap:8},valueInput:{flex:1,minWidth:70,fontSize:30,fontWeight:'900',color:'#0F172A',paddingVertical:4},slash:{fontWeight:'900',fontSize:26,color:'#94A3B8'},unit:{fontWeight:'900',color:'#64748B'},sourceCard:{backgroundColor:'#EFF6FF',borderWidth:1,borderColor:'#BFDBFE',borderRadius:14,padding:12,gap:4},sourceTitle:{fontSize:10,fontWeight:'900',color:'#1D4ED8',letterSpacing:.6},sourceText:{fontSize:12,fontWeight:'800',color:'#1E3A8A'},sourceLine:{fontSize:11,color:'#334155',lineHeight:16},notes:{backgroundColor:'#fff',borderWidth:1,borderColor:'#E2E8F0',borderRadius:16,padding:14,fontSize:15,height:96,textAlignVertical:'top'},
  primary:{marginTop:14,backgroundColor:'#2563EB',padding:16,borderRadius:16,alignItems:'center'},primaryText:{color:'#fff',fontWeight:'900',fontSize:15},delete:{padding:15,alignItems:'center'},deleteText:{color:'#DC2626',fontWeight:'900'}
});
