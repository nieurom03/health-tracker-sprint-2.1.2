import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { CLINICAL_KINDS, deleteClinicalEntry, listClinicalEntries, saveClinicalEntry } from '@/database/repositories/clinicalRepository';
import { getPatient } from '@/database/repositories/patientRepository';
import type { ClinicalEntry, ClinicalKind, Patient } from '@/types/health';
import { formatDate } from '@/utils/format';

export default function ClinicalRecordScreen() {
  const { patientId: rawId } = useLocalSearchParams<{ patientId: string }>();
  const patientId = Number(rawId); const db = useSQLiteContext();
  const [patient,setPatient]=useState<Patient|null>(null); const [items,setItems]=useState<ClinicalEntry[]>([]);
  const [kind,setKind]=useState<ClinicalKind>('diagnosis'); const [title,setTitle]=useState(''); const [details,setDetails]=useState('');
  const [date,setDate]=useState(''); const [facility,setFacility]=useState(''); const [clinician,setClinician]=useState(''); const [editingId,setEditingId]=useState<number>();
  const load=useCallback(async()=>{setPatient(await getPatient(db,patientId));setItems(await listClinicalEntries(db,patientId));},[db,patientId]);
  useFocusEffect(useCallback(()=>{load();},[load]));
  function reset(){setEditingId(undefined);setTitle('');setDetails('');setDate('');setFacility('');setClinician('');}
  function edit(item:ClinicalEntry){setEditingId(item.id);setKind(item.kind);setTitle(item.title);setDetails(item.details??'');setDate(item.event_date?.slice(0,10)??'');setFacility(item.facility??'');setClinician(item.clinician??'');}
  async function save(){if(!title.trim())return Alert.alert('Thiếu nội dung','Hãy nhập tên chẩn đoán hoặc nội dung chính.');await saveClinicalEntry(db,{id:editingId,patientId,kind,title,details,eventDate:date,facility,clinician});reset();await load();}
  function remove(item:ClinicalEntry){Alert.alert('Xóa mục hồ sơ?',item.title,[{text:'Hủy',style:'cancel'},{text:'Xóa',style:'destructive',onPress:async()=>{await deleteClinicalEntry(db,item.id);if(editingId===item.id)reset();await load();}}]);}
  return <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
    <View style={s.hero}><Text style={s.overline}>HỒ SƠ BỆNH ÁN</Text><Text style={s.heroTitle}>{patient?.name??'Bệnh nhân'}</Text><Text style={s.heroText}>Lưu chẩn đoán, tiền sử, dị ứng, toa thuốc và các lần khám trên thiết bị.</Text></View>
    <Text style={s.heading}>{editingId?'Chỉnh sửa mục':'Thêm thông tin'}</Text>
    <View style={s.chips}>{CLINICAL_KINDS.map(x=><Pressable key={x.key} style={[s.chip,kind===x.key&&s.chipOn]} onPress={()=>setKind(x.key)}><Text style={[s.chipText,kind===x.key&&s.chipTextOn]}>{x.name}</Text></Pressable>)}</View>
    <Text style={s.hint}>{CLINICAL_KINDS.find(x=>x.key===kind)?.hint}</Text>
    <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Nội dung chính *" />
    <TextInput style={[s.input,s.multiline]} value={details} onChangeText={setDetails} placeholder="Diễn giải, triệu chứng, hướng dẫn..." multiline />
    <View style={s.row}><TextInput style={[s.input,s.half]} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD"/><TextInput style={[s.input,s.half]} value={clinician} onChangeText={setClinician} placeholder="Bác sĩ"/></View>
    <TextInput style={s.input} value={facility} onChangeText={setFacility} placeholder="Bệnh viện / cơ sở y tế"/>
    <Pressable style={s.primary} onPress={save}><Text style={s.primaryText}>{editingId?'Lưu chỉnh sửa':'Thêm vào hồ sơ'}</Text></Pressable>
    {editingId&&<Pressable onPress={reset}><Text style={s.cancel}>Hủy chỉnh sửa</Text></Pressable>}
    <Text style={s.heading}>Lịch sử hồ sơ</Text>
    {items.length===0?<Text style={s.empty}>Chưa có thông tin bệnh án.</Text>:items.map(item=><Pressable key={item.id} style={s.card} onPress={()=>edit(item)} onLongPress={()=>remove(item)}><View style={s.cardTop}><Text style={s.kind}>{CLINICAL_KINDS.find(x=>x.key===item.kind)?.name}</Text><Text style={s.date}>{formatDate(item.event_date)}</Text></View><Text style={s.title}>{item.title}</Text>{item.details&&<Text style={s.details}>{item.details}</Text>}<Text style={s.meta}>{[item.facility,item.clinician].filter(Boolean).join(' · ')||'Chạm để chỉnh sửa · Giữ để xóa'}</Text></Pressable>)}
  </ScrollView>;
}
const s=StyleSheet.create({container:{padding:18,paddingBottom:50,gap:10,backgroundColor:'#F8FAFC'},hero:{backgroundColor:'#0F172A',borderRadius:22,padding:20},overline:{color:'#93C5FD',fontSize:10,fontWeight:'900',letterSpacing:1},heroTitle:{color:'#fff',fontSize:25,fontWeight:'900',marginTop:5},heroText:{color:'#CBD5E1',fontSize:12,lineHeight:18,marginTop:6},heading:{fontSize:18,fontWeight:'900',color:'#0F172A',marginTop:8},chips:{flexDirection:'row',flexWrap:'wrap',gap:7},chip:{backgroundColor:'#fff',borderWidth:1,borderColor:'#DCE3EC',borderRadius:99,paddingHorizontal:11,paddingVertical:8},chipOn:{backgroundColor:'#2563EB',borderColor:'#2563EB'},chipText:{color:'#475569',fontSize:11,fontWeight:'800'},chipTextOn:{color:'#fff'},hint:{fontSize:10,color:'#64748B'},input:{backgroundColor:'#fff',borderWidth:1,borderColor:'#D0D5DD',borderRadius:13,paddingHorizontal:13,paddingVertical:12,color:'#0F172A'},multiline:{height:90,textAlignVertical:'top'},row:{flexDirection:'row',gap:8},half:{flex:1},primary:{backgroundColor:'#2563EB',borderRadius:14,padding:14,alignItems:'center'},primaryText:{color:'#fff',fontWeight:'900'},cancel:{color:'#64748B',textAlign:'center',fontWeight:'800',padding:8},empty:{backgroundColor:'#fff',padding:22,borderRadius:16,color:'#64748B',textAlign:'center'},card:{backgroundColor:'#fff',borderWidth:1,borderColor:'#E2E8F0',borderRadius:16,padding:14},cardTop:{flexDirection:'row',justifyContent:'space-between'},kind:{color:'#2563EB',fontSize:10,fontWeight:'900'},date:{color:'#94A3B8',fontSize:10},title:{color:'#0F172A',fontSize:15,fontWeight:'900',marginTop:6},details:{color:'#475569',fontSize:12,lineHeight:18,marginTop:5},meta:{color:'#94A3B8',fontSize:9,marginTop:7}});
