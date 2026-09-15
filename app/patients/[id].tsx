import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getPatient, setSelectedPatientId } from '@/database/repositories/patientRepository';
import { getTimeline } from '@/database/repositories/metricRepository';
import type { MetricPoint, Patient } from '@/types/health';
import { formatDate, formatDateTime } from '@/utils/format';

export default function PatientDetail(){
 const {id}=useLocalSearchParams<{id:string}>(); const patientId=Number(id); const db=useSQLiteContext(); const [p,setP]=useState<Patient|null>(null); const [items,setItems]=useState<MetricPoint[]>([]);
 const load=useCallback(async()=>{if(!patientId)return;setP(await getPatient(db,patientId));setItems(await getTimeline(db,patientId,10));},[db,patientId]); useFocusEffect(useCallback(()=>{load();},[load]));
 if(!p)return <View style={styles.container}><Text>Không tìm thấy bệnh nhân.</Text></View>;
 return <ScrollView contentContainerStyle={styles.container}><View style={styles.hero}><Text style={styles.name}>{p.name}</Text><Text style={styles.meta}>Sinh: {formatDate(p.dob)} · {p.gender||'—'} · Nhóm máu {p.blood_type||'—'}</Text>{p.notes?<Text style={styles.notes}>{p.notes}</Text>:null}</View>
 <View style={styles.actions}><Pressable style={styles.primary} onPress={async()=>{await setSelectedPatientId(db,p.id);router.replace('/')}}><Text style={styles.primaryText}>Theo dõi bệnh nhân này</Text></Pressable><Pressable style={styles.secondary} onPress={()=>router.push({pathname:'/patients/edit/[id]',params:{id:p.id}})}><Text style={styles.secondaryText}>Cập nhật hồ sơ</Text></Pressable><Pressable style={styles.secondary} onPress={()=>router.push({pathname:'/records/new',params:{patientId:p.id}})}><Text style={styles.secondaryText}>+ Thêm chỉ số</Text></Pressable></View>
 <Text style={styles.heading}>10 dữ liệu gần nhất</Text>{items.map(x=><View key={`${x.source}-${x.id}`} style={styles.row}><View><Text style={styles.metric}>{x.metric_name}</Text><Text style={styles.date}>{formatDateTime(x.measured_at)}</Text></View><Text style={styles.value}>{x.value2!=null?`${x.value}/${x.value2}`:x.value} {x.unit}</Text></View>)}</ScrollView>
}
const styles=StyleSheet.create({container:{padding:18,gap:12,backgroundColor:'#F6F8FB',minHeight:'100%'},hero:{backgroundColor:'#172033',padding:22,borderRadius:22,gap:6},name:{color:'#fff',fontSize:28,fontWeight:'900'},meta:{color:'#CDD5E0'},notes:{color:'#E4E7EC',marginTop:8,lineHeight:20},actions:{gap:10},primary:{backgroundColor:'#2563EB',padding:15,borderRadius:14,alignItems:'center'},primaryText:{color:'#fff',fontWeight:'800'},secondary:{backgroundColor:'#fff',padding:15,borderRadius:14,alignItems:'center',borderWidth:1,borderColor:'#D0D5DD'},secondaryText:{color:'#2563EB',fontWeight:'800'},heading:{fontSize:18,fontWeight:'900',color:'#172033',marginTop:8},row:{backgroundColor:'#fff',padding:15,borderRadius:14,flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderWidth:1,borderColor:'#E7EAF0'},metric:{fontWeight:'800',color:'#172033'},date:{fontSize:11,color:'#98A2B3',marginTop:4},value:{fontWeight:'800',color:'#344054'}});
