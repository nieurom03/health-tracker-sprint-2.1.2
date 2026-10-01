import { useMemo, useRef } from "react";
import { ScrollView, View } from "react-native";
import Svg, { Circle, G, Line, Rect, Text as SvgText } from "react-native-svg";

import type { MetricPoint } from "@/types/health";

type Props = {
  data: MetricPoint[];
  width?: number;
  height?: number;
  referenceMin?: number | null;
  referenceMax?: number | null;
};

function compactNumber(value: number) {
  const digits = Math.abs(value) >= 100 ? 0 : Math.abs(value) >= 10 ? 1 : 2;
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: digits,
  }).format(value);
}

function compactDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 5);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function outsideReference(
  value: number,
  min: number | null | undefined,
  max: number | null | undefined,
) {
  return (min != null && value < min) || (max != null && value > max);
}

export default function TrendChart({
  data,
  width = 330,
  height = 240,
  referenceMin = null,
  referenceMax = null,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const geometry = useMemo(() => {
    const left = 48;
    const right = 14;
    const top = 28;
    const bottom = 48;
    const chartWidth = Math.max(width, left + right + data.length * 62);
    const plotWidth = chartWidth - left - right;
    const plotHeight = height - top - bottom;
    const scaleValues = data.map((item) => item.value);
    if (referenceMin != null) scaleValues.push(referenceMin);
    if (referenceMax != null) scaleValues.push(referenceMax);
    let rawMin = Math.min(...scaleValues);
    let rawMax = Math.max(...scaleValues);
    if (!Number.isFinite(rawMin) || !Number.isFinite(rawMax)) {
      rawMin = 0;
      rawMax = 1;
    }
    const rawSpan = rawMax - rawMin;
    const padding = Math.max(
      rawSpan * 0.18,
      Math.max(Math.abs(rawMin), Math.abs(rawMax)) * 0.05,
      0.1,
    );
    const domainMin = rawMin - padding;
    const domainMax = rawMax + padding;
    const domainSpan = domainMax - domainMin || 1;
    const y = (value: number) =>
      top + plotHeight * (1 - (value - domainMin) / domainSpan);
    const step = plotWidth / Math.max(data.length, 1);
    const barWidth = Math.min(24, Math.max(10, step * 0.42));
    return {
      left,
      right,
      top,
      chartWidth,
      plotWidth,
      plotHeight,
      domainMin,
      domainMax,
      y,
      step,
      barWidth,
    };
  }, [data, height, referenceMax, referenceMin, width]);

  const hasReference = referenceMin != null || referenceMax != null;
  const plotBottom = geometry.top + geometry.plotHeight;
  const bandTop = geometry.y(referenceMax ?? geometry.domainMax);
  const bandBottom = geometry.y(referenceMin ?? geometry.domainMin);
  const ticks = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    return geometry.domainMax - ratio * (geometry.domainMax - geometry.domainMin);
  });

  return (
    <View
      style={{ width }}
      accessible
      accessibilityLabel={
        hasReference
          ? `Biểu đồ cột với vùng tham chiếu từ ${referenceMin ?? "không giới hạn"} đến ${referenceMax ?? "không giới hạn"}`
          : "Biểu đồ cột lịch sử chỉ số theo ngày"
      }
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={data.length > 5}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        <Svg width={geometry.chartWidth} height={height}>
          {ticks.map((tick, index) => {
            const y = geometry.y(tick);
            return (
              <G key={`tick-${index}`}>
                <Line
                  x1={geometry.left}
                  y1={y}
                  x2={geometry.chartWidth - geometry.right}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />
                <SvgText
                  x={geometry.left - 7}
                  y={y + 4}
                  fill="#94A3B8"
                  fontSize="9"
                  fontWeight="700"
                  textAnchor="end"
                >
                  {compactNumber(tick)}
                </SvgText>
              </G>
            );
          })}

          {hasReference && (
            <>
              <Rect
                x={geometry.left}
                y={Math.min(bandTop, bandBottom)}
                width={geometry.plotWidth}
                height={Math.max(2, Math.abs(bandBottom - bandTop))}
                rx="6"
                fill="#22C55E"
                opacity="0.18"
              />
              {referenceMax != null && (
                <Line
                  x1={geometry.left}
                  y1={geometry.y(referenceMax)}
                  x2={geometry.chartWidth - geometry.right}
                  y2={geometry.y(referenceMax)}
                  stroke="#16A34A"
                  strokeWidth="1.5"
                  strokeDasharray="5 4"
                />
              )}
              {referenceMin != null && (
                <Line
                  x1={geometry.left}
                  y1={geometry.y(referenceMin)}
                  x2={geometry.chartWidth - geometry.right}
                  y2={geometry.y(referenceMin)}
                  stroke="#16A34A"
                  strokeWidth="1.5"
                  strokeDasharray="5 4"
                />
              )}
            </>
          )}

          <Line
            x1={geometry.left}
            y1={plotBottom}
            x2={geometry.chartWidth - geometry.right}
            y2={plotBottom}
            stroke="#CBD5E1"
            strokeWidth="1"
          />

          {data.map((item, index) => {
            const x = geometry.left + geometry.step * (index + 0.5);
            const valueY = geometry.y(item.value);
            const isOutside = outsideReference(
              item.value,
              referenceMin,
              referenceMax,
            );
            const color = !hasReference
              ? "#2563EB"
              : isOutside
                ? "#EF4444"
                : "#16A34A";
            const barTop = Math.min(valueY, plotBottom);
            const barHeight = Math.max(2, Math.abs(plotBottom - valueY));
            return (
              <G key={`${item.source}-${item.id}`}>
                <Rect
                  x={x - geometry.barWidth / 2}
                  y={barTop}
                  width={geometry.barWidth}
                  height={barHeight}
                  rx={geometry.barWidth / 2}
                  fill={color}
                  opacity="0.72"
                />
                <Circle
                  cx={x}
                  cy={valueY}
                  r="5"
                  fill={color}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
                <SvgText
                  x={x}
                  y={Math.max(12, valueY - 9)}
                  fill={color}
                  fontSize="9"
                  fontWeight="900"
                  textAnchor="middle"
                >
                  {compactNumber(item.value)}
                </SvgText>
                <SvgText
                  x={x}
                  y={height - 19}
                  fill="#64748B"
                  fontSize="9"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {compactDate(item.measured_at)}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </ScrollView>
    </View>
  );
}
