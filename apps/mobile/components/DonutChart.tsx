import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type ChartData = {
  label: string;
  value: number;
  color: string;
};

export default function DonutChart({ data, activeCount }: { data: ChartData[], activeCount: number }) {
  const size = 160;
  const strokeWidth = 24;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#F3F4F6"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {data.map((item, index) => {
          const strokeDasharray = `${(item.value / total) * circumference} ${circumference}`;
          const strokeDashoffset = -currentOffset;
          currentOffset += (item.value / total) * circumference;

          // Only render if > 0 to avoid artifacts
          if (item.value <= 0) return null;

          return (
            <Circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              stroke={item.color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="butt"
              origin={`${center}, ${center}`}
              rotation="-90"
            />
          );
        })}
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text className="text-xl font-bold text-gray-800">{activeCount}</Text>
        <Text className="text-xs text-gray-500 font-medium">active</Text>
      </View>
    </View>
  );
}
