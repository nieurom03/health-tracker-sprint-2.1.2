import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { deletePatient, getSelectedPatientId, listPatients, setSelectedPatientId } from '@/database/repositories/patientRepository';
import type { Patient } from '@/types/health';
import { formatDate } from '@/utils/format';

export default function PatientsScreen() {
  const db = useSQLiteContext();
  const [items, setItems] = useState<Patient[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const load = useCallback(async () => { setItems(await listPatients(db)); setSelected(await getSelectedPatientId(db)); }, [db]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function choose(id: number) { await setSelectedPatientId(db, id); setSelected(id); }
  function remove(item: Patient) {
    Alert.alert('Xóa bệnh nhân?', `Toàn bộ dữ liệu của ${item.name} sẽ bị xóa khỏi máy.`, [
      { text:'Hủy', style:'cancel' },
      { text:'Xóa', style:'destructive', onPress: async () => { await deletePatient(db, item.id); await load(); } }
    ]);
  }

  return <ScrollView contentContainerStyle={[styles.container,{paddingBottom:130}]}>
    <Pressable style={styles.primary} onPress={() => router.push('/patients/new')}><Text style={styles.primaryText}>+ Thêm bệnh nhân</Text></Pressable>
    {items.map(item => <Pressable key={item.id} style={[styles.card, selected===item.id && styles.selected]} onPress={() => choose(item.id)}>
      <View style={{flex:1}}><Text style={styles.name}>{item.name}</Text><Text style={styles.meta}>Ngày sinh: {formatDate(item.dob)} · Nhóm máu: {item.blood_type || '—'}</Text>{selected===item.id && <Text style={styles.active}>Đang theo dõi</Text>}</View>
      <View style={styles.actions}><Pressable onPress={() => router.push(`/patients/${item.id}`)}><Text style={styles.link}>Xem</Text></Pressable><Pressable onPress={() => router.push({pathname:'/patients/edit/[id]',params:{id:item.id}})}><Text style={styles.edit}>Sửa</Text></Pressable><Pressable onPress={() => remove(item)}><Text style={styles.delete}>Xóa</Text></Pressable></View>
    </Pressable>)}
  </ScrollView>;
}
const styles=StyleSheet.create({container:{padding:18,gap:12,backgroundColor:'#F6F8FB',minHeight:'100%'},primary:{backgroundColor:'#2563EB',padding:15,borderRadius:14,alignItems:'center',marginBottom:4},primaryText:{color:'#fff',fontWeight:'800'},card:{backgroundColor:'#fff',borderRadius:18,padding:16,borderWidth:1,borderColor:'#E4E7EC',flexDirection:'row',gap:12},selected:{borderColor:'#2563EB',borderWidth:2},name:{fontSize:18,fontWeight:'800',color:'#172033'},meta:{fontSize:12,color:'#667085',marginTop:5},active:{fontSize:12,color:'#2563EB',fontWeight:'800',marginTop:8},actions:{justifyContent:'space-around',alignItems:'flex-end'},link:{color:'#2563EB',fontWeight:'700'},edit:{color:'#475467',fontWeight:'700'},delete:{color:'#D92D20',fontWeight:'700'}});
