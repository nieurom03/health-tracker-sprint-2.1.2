import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import type { MetricPoint } from '@/types/health';

export default function TrendChart({ data, width = 330, height = 180 }: { data: MetricPoint[]; width?: number; height?: number }) {
  const points = useMemo(() => {
    if (!data.length) return '';
    const values = data.map(x => x.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(max - min, 1);
    const xStep = data.length === 1 ? 0 : (width - 32) / (data.length - 1);
    return data.map((x, i) => {
      const px = 16 + i * xStep;
      const py = 16 + (height - 32) * (1 - (x.value - min) / span);
      return `${px},${py}`;
    }).join(' ');
  }, [data, width, height]);

  return (
    <View>
      <Svg width={width} height={height}>
        <Line x1="16" y1={height - 16} x2={width - 16} y2={height - 16} stroke="#D0D5DD" strokeWidth="1" />
        <Polyline points={points} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {points.split(' ').filter(Boolean).map((p, i) => {
          const [cx, cy] = p.split(',').map(Number);
          return <Circle key={i} cx={cx} cy={cy} r="4" fill="#2563EB" />;
        })}
      </Svg>
    </View>
  );
}
