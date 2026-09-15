import { StyleSheet, Text, View } from 'react-native';
export default function EmptyState({ title, text }: { title: string; text: string }) {
  return <View style={styles.box}><Text style={styles.title}>{title}</Text><Text style={styles.text}>{text}</Text></View>;
}
const styles = StyleSheet.create({ box:{padding:24,borderRadius:18,backgroundColor:'#fff',alignItems:'center',gap:8,borderWidth:1,borderColor:'#E7EAF0'},title:{fontWeight:'800',fontSize:16,color:'#172033'},text:{textAlign:'center',color:'#667085',lineHeight:20} });
