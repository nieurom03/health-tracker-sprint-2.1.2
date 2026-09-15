import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MetricPoint } from '@/types/health';
import { metricDefinition } from '@/database/repositories/metricRepository';
import { formatMetricValue } from '@/utils/format';
import AppIcon from '@/components/AppIcon';
export default function MetricCard({ item, onPress }: { item: MetricPoint; onPress?: () => void }) {
  const def = metricDefinition(item.source, item.metric_key) as any;
  return <Pressable style={({pressed})=>[styles.card,pressed&&styles.pressed]} onPress={onPress}>
    <View style={styles.top}><View style={styles.icon}>{item.source==='vital'?<AppIcon ios="waveform.path.ecg" android="monitoring" size={18}/>:<Text style={styles.iconText}>{def?.icon ?? 'LAB'}</Text>}</View><AppIcon ios="chevron.right" android="chevron_right" size={15} color="#CBD5E1" /></View>
    <Text style={styles.name}>{item.metric_name}</Text>
    <View style={styles.row}><Text style={styles.value}>{formatMetricValue(item.value,item.value2)}</Text><Text style={styles.unit}>{item.unit}</Text></View>
    <Text style={styles.date}>{new Date(item.measured_at).toLocaleDateString('vi-VN')}</Text>
  </Pressable>;
}
const styles=StyleSheet.create({card:{width:'48%',backgroundColor:'#fff',padding:15,borderRadius:20,gap:5,borderWidth:1,borderColor:'#E2E8F0'},pressed:{opacity:.75},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},icon:{minWidth:32,height:32,paddingHorizontal:7,borderRadius:10,backgroundColor:'#EFF6FF',alignItems:'center',justifyContent:'center'},iconText:{color:'#2563EB',fontWeight:'900',fontSize:12},name:{color:'#64748B',fontSize:12,fontWeight:'800',marginTop:2},row:{flexDirection:'row',alignItems:'baseline',gap:5},value:{fontSize:24,fontWeight:'900',color:'#0F172A'},unit:{fontSize:11,color:'#64748B',fontWeight:'700'},date:{fontSize:10,color:'#94A3B8',fontWeight:'700'}});
