import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing, interpolateColor } from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function HealthArc({ score }: { score: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(score / 100, {
      duration: 1500,
      easing: Easing.out(Easing.cubic),
    });
  }, [score]);

  // Arc path from bottom left to bottom right
  // cx=80, cy=80, r=60
  // start angle: 140 deg, end angle: 40 deg
  // This is a 260 degree arc. Let's just use a simple semi-circle for ease.
  // M 20 100 A 60 60 0 1 1 140 100
  const pathData = "M 20 100 A 60 60 0 1 1 140 100";
  const pathLength = 250; // approximate length

  const animatedProps = useAnimatedProps(() => {
    const color = interpolateColor(
      progress.value,
      [0, 0.5, 1],
      ['#EF4444', '#F59E0B', '#10B981']
    );
    
    return {
      strokeDashoffset: pathLength - pathLength * progress.value,
      stroke: color,
    };
  });

  return (
    <View className="items-center justify-center h-28 relative">
      <Svg width={160} height={120} viewBox="0 0 160 120">
        <Path
          d={pathData}
          stroke="#F4F6F9"
          strokeWidth={16}
          strokeLinecap="round"
          fill="none"
        />
        <AnimatedPath
          d={pathData}
          strokeWidth={16}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={pathLength}
          animatedProps={animatedProps}
        />
      </Svg>
      <View className="absolute" style={{ top: 55, alignItems: 'center' }}>
        <Text className="text-4xl font-bold text-[#111827]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{score}</Text>
      </View>
    </View>
  );
}
