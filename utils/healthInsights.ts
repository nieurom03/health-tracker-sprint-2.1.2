import type { MetricPoint } from '@/types/health';

export type HealthInsight = { key: string; title: string; detail: string; tone: 'info'|'warning'|'positive' };

export function buildHealthInsights(metrics: MetricPoint[]): HealthInsight[] {
  const groups=new Map<string,MetricPoint[]>();
  for(const metric of metrics){const list=groups.get(metric.metric_key)??[];list.push(metric);groups.set(metric.metric_key,list);}
  const insights:HealthInsight[]=[];
  for(const [key,list] of groups){
    list.sort((a,b)=>new Date(b.measured_at).getTime()-new Date(a.measured_at).getTime());
    const latest=list[0];const min=latest.reference_min??null;const max=latest.reference_max??null;
    if(min!==null&&latest.value<min)insights.push({key:`${key}-range`,title:`${latest.metric_name} thấp hơn khoảng tham chiếu`,detail:`${latest.value} ${latest.unit} · tham chiếu từ ${min}`,tone:'warning'});
    else if(max!==null&&latest.value>max)insights.push({key:`${key}-range`,title:`${latest.metric_name} cao hơn khoảng tham chiếu`,detail:`${latest.value} ${latest.unit} · tham chiếu đến ${max}`,tone:'warning'});
    if(list.length>1){const previous=list[1];const delta=latest.value-previous.value;const threshold=Math.max(Math.abs(previous.value)*0.03,0.01);if(Math.abs(delta)>=threshold)insights.push({key:`${key}-trend`,title:`${latest.metric_name} đang ${delta>0?'tăng':'giảm'}`,detail:`Thay đổi ${Math.abs(delta).toFixed(2)} ${latest.unit} so với lần gần nhất`,tone:delta===0?'positive':'info'});}
  }
  if(!insights.length&&metrics.length)insights.push({key:'stable',title:'Chưa thấy thay đổi đáng chú ý',detail:'Các dữ liệu hiện có chưa tạo thành cảnh báo theo quy tắc của ứng dụng.',tone:'positive'});
  return insights;
}
