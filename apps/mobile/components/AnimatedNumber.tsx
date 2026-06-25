import React, { useEffect } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';

Animated.addWhitelistedNativeProps({ text: true });
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedNumberProps extends Omit<TextInputProps, 'value'> {
  value: number;
  prefix?: string;
  duration?: number;
  decimals?: number;
}

export default function AnimatedNumber({ value, prefix = '', duration = 1500, decimals = 0, style, ...rest }: AnimatedNumberProps) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  const animatedProps = useAnimatedProps(() => {
    return {
      text: `${prefix}${animatedValue.value.toFixed(decimals)}`,
    } as any;
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      value={`${prefix}${value}`} // Fallback for some environments
      animatedProps={animatedProps}
      style={[style, { padding: 0, margin: 0 }]}
      {...rest}
    />
  );
}
