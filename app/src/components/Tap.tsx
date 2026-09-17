import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import { Animated, Platform, Pressable, StyleProp, ViewStyle } from 'react-native';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: Haptics.ImpactFeedbackStyle | null;
  disabled?: boolean;
  hitSlop?: number;
};

export const tapFeedback = (style = Haptics.ImpactFeedbackStyle.Light) => {
  if (Platform.OS !== 'web') {
    void Haptics.impactAsync(style);
  }
};

/** Pressable that springs down and fires a haptic tick, used for every tappable surface. */
export const Tap = ({
  children,
  onPress,
  style,
  scaleTo = 0.96,
  haptic = Haptics.ImpactFeedbackStyle.Light,
  disabled,
  hitSlop,
}: Props) => {
  const scale = useRef(new Animated.Value(1)).current;

  const spring = (to: number) =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();

  return (
    <Pressable
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => spring(scaleTo)}
      onPressOut={() => spring(1)}
      onPress={() => {
        if (haptic) {
          tapFeedback(haptic);
        }
        onPress?.();
      }}
    >
      <Animated.View style={[style, { transform: [{ scale }], opacity: disabled ? 0.5 : 1 }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};
