import { useLocalSearchParams } from 'expo-router';
import MetricForm from '@/components/form/MetricForm';
export default function NewRecord() {
  const { patientId } = useLocalSearchParams<{patientId:string}>();
  return <MetricForm patientId={Number(patientId)} />;
}
