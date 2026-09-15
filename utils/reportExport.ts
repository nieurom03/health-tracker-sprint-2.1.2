import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';
import type { ClinicalEntry, Medication, MetricPoint, Patient } from '@/types/health';

export type HealthReportData={patient:Patient;metrics:MetricPoint[];clinical:ClinicalEntry[];medications:Medication[];months:number};
const esc=(v:unknown)=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const stamp=()=>new Date().toISOString().slice(0,10);

function reportCharts(metrics:MetricPoint[]){
 const groups=new Map<string,MetricPoint[]>();for(const point of metrics){const list=groups.get(point.metric_key)??[];list.push(point);groups.set(point.metric_key,list);}
 return [...groups.values()].filter(points=>points.length>1).slice(0,6).map(points=>{const ordered=[...points].sort((a,b)=>new Date(a.measured_at).getTime()-new Date(b.measured_at).getTime());const values=ordered.map(x=>x.value);const min=Math.min(...values);const max=Math.max(...values);const span=max-min||1;const coords=ordered.map((x,index)=>`${ordered.length===1?0:index*260/(ordered.length-1)},${64-(x.value-min)*54/span}`).join(' ');const latest=ordered.at(-1)!;return `<div class="chart"><div><b>${esc(latest.metric_name)}</b><span>${esc(latest.value)} ${esc(latest.unit)}</span></div><svg viewBox="0 0 260 70" role="img" aria-label="Xu hướng ${esc(latest.metric_name)}"><line x1="0" y1="64" x2="260" y2="64" stroke="#dbeafe"/><polyline points="${coords}" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;}).join('');
}

export function reportHtml(data:HealthReportData){
 const rows=data.metrics.map(x=>`<tr><td>${esc(new Date(x.measured_at).toLocaleDateString('vi-VN'))}</td><td><b>${esc(x.metric_name)}</b></td><td>${esc(x.value2==null?x.value:`${x.value}/${x.value2}`)} ${esc(x.unit)}</td><td>${esc(x.reference_min==null&&x.reference_max==null?'—':`${x.reference_min??'—'} - ${x.reference_max??'—'}`)}</td></tr>`).join('');
 const meds=data.medications.map(x=>`<li><b>${esc(x.name)}</b> - ${esc(x.dosage||'chưa có liều')}, ${esc(x.frequency||'chưa có lịch')} (${x.status==='active'?'đang dùng':'đã ngưng'})</li>`).join('')||'<li>Chưa có dữ liệu</li>';
 const clinical=data.clinical.map(x=>`<li><b>${esc(x.title)}</b>${x.details?`: ${esc(x.details)}`:''}</li>`).join('')||'<li>Chưa có dữ liệu</li>';
 const charts=reportCharts(data.metrics);
 return `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:28px}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033;font-size:11px}header{background:#0f172a!important;color:white;padding:17px 20px;border-radius:14px}h1{margin:3px 0;font-size:24px}.tag{color:#93c5fd;font-weight:800;letter-spacing:1px}.meta{color:#cbd5e1}h2{font-size:15px;margin:16px 0 7px;border-bottom:2px solid #dbeafe;padding-bottom:5px}.charts{display:grid;grid-template-columns:1fr 1fr;gap:8px}.chart{border:1px solid #dbeafe;border-radius:10px;padding:8px;break-inside:avoid}.chart div{display:flex;justify-content:space-between}.chart span{color:#2563eb;font-weight:bold}.chart svg{width:100%;height:58px;margin-top:2px}table{width:100%;border-collapse:collapse}thead{display:table-header-group}tr{break-inside:avoid}th{background:#eff6ff!important;text-align:left}th,td{padding:7px;border-bottom:1px solid #e2e8f0;vertical-align:top}li{margin:6px 0}.notice{margin-top:18px;padding:11px;background:#fffbeb!important;border:1px solid #fde68a;border-radius:10px;color:#92400e;break-inside:avoid}.footer{margin-top:14px;color:#94a3b8;font-size:9px;text-align:center}</style></head><body><header><div class="tag">HEALTH TRACKER · BÁO CÁO ${data.months} THÁNG</div><h1>${esc(data.patient.name)}</h1><div class="meta">Sinh: ${esc(data.patient.dob||'—')} · Nhóm máu: ${esc(data.patient.blood_type||'—')} · Lập ngày ${esc(stamp())}</div></header>${charts?`<h2>Biểu đồ xu hướng</h2><div class="charts">${charts}</div>`:''}<h2>Chỉ số sức khỏe (${data.metrics.length})</h2><table><thead><tr><th>Ngày</th><th>Chỉ số</th><th>Kết quả</th><th>Tham chiếu</th></tr></thead><tbody>${rows||'<tr><td colspan="4">Chưa có dữ liệu trong kỳ</td></tr>'}</tbody></table><h2>Thuốc</h2><ul>${meds}</ul><h2>Hồ sơ bệnh án</h2><ul>${clinical}</ul><div class="notice"><b>Lưu ý:</b> Báo cáo tổng hợp dữ liệu người dùng đã lưu, không thay thế tư vấn hoặc chẩn đoán của nhân viên y tế.</div><div class="footer">Tạo offline bởi Health Tracker</div></body></html>`;
}

export function reportCsv(data:HealthReportData){
 const q=(v:unknown)=>`"${String(v??'').replace(/"/g,'""')}"`;
 return ['date,code,name,value,value2,unit,reference_min,reference_max,notes',...data.metrics.map(x=>[x.measured_at,x.metric_key,x.metric_name,x.value,x.value2??'',x.unit,x.reference_min??'',x.reference_max??'',x.notes??''].map(q).join(','))].join('\n');
}

async function share(uri:string,mimeType:string,title:string){if(!(await Sharing.isAvailableAsync()))throw new Error('Thiết bị không hỗ trợ bảng chia sẻ.');await Sharing.shareAsync(uri,{mimeType,dialogTitle:title});}
export async function exportReportPdf(data:HealthReportData){const result=await Print.printToFileAsync({html:reportHtml(data)});await share(result.uri,'application/pdf','Chia sẻ báo cáo sức khỏe');return result.uri;}
export async function exportReportCsv(data:HealthReportData){const file=new File(Paths.cache,`health-report-${stamp()}.csv`);file.create({overwrite:true});file.write(reportCsv(data));await share(file.uri,'text/csv','Chia sẻ dữ liệu CSV');return file.uri;}
export async function exportReportZip(data:HealthReportData){const pdf=await Print.printToFileAsync({html:reportHtml(data)});const zip=new JSZip();zip.file(`health-report-${stamp()}.csv`,reportCsv(data));zip.file(`health-report-${stamp()}.pdf`,await new File(pdf.uri).base64(),{base64:true});zip.file('README.txt','Gói hồ sơ được xuất offline từ Health Tracker. Dữ liệu y tế cần được chia sẻ qua kênh an toàn.');const output=new File(Paths.cache,`health-record-${stamp()}.zip`);output.create({overwrite:true});output.write(await zip.generateAsync({type:'base64'}),{encoding:'base64'});await share(output.uri,'application/zip','Chia sẻ hồ sơ sức khỏe');return output.uri;}
