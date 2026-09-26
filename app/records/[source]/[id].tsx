import { useThemedStyles } from "@/hooks/useTheme";
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import MetricForm from '@/components/form/MetricForm';
import { getMetricRecord } from '@/database/repositories/metricRepository';
import type { MetricPoint, MetricSource } from '@/types/health';
export default function EditRecord() {
  const styles = useThemedStyles(baseStyles);
  const { id, source } = useLocalSearchParams<{id:string;source:MetricSource}>();
  const db = useSQLiteContext(); const [item,setItem]=useState<MetricPoint|null>(null);
  useFocusEffect(useCallback(()=>{ let active=true; getMetricRecord(db,source,Number(id)).then(x=>{if(active)setItem(x??null)}); return()=>{active=false}; },[db,id,source]));
  if(!item) return <View style={styles.center}><ActivityIndicator/></View>;
  return <MetricForm patientId={item.patient_id} initial={item}/>;
}
const baseStyles = StyleSheet.create({center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#F8FAFC'}});
