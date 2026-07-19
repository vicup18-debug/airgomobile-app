import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, withDelay, Easing, runOnJS, useAnimatedStyle } from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface AnimatedSplashProps {
  onComplete: () => void;
}

export default function AnimatedSplash({ onComplete }: AnimatedSplashProps) {
  const orangeProgress = useSharedValue(1000);
  const blueProgress = useSharedValue(1000);
  const fillProgress = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Phase 1: Draw lines
    orangeProgress.value = withTiming(0, {
      duration: 1500,
      easing: Easing.inOut(Easing.ease),
    });

    blueProgress.value = withDelay(
      200,
      withTiming(0, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      })
    );

    // Phase 2: Fill shapes
    fillProgress.value = withDelay(1500, withTiming(1, { duration: 800 }));

    // Phase 3: Transition out
    opacity.value = withDelay(2800, withTiming(0, { duration: 700 }));
    scale.value = withDelay(2800, withTiming(1.1, { duration: 700 }, (finished) => {
      if (finished) {
        runOnJS(onComplete)();
      }
    }));
  }, [onComplete, orangeProgress, blueProgress, fillProgress, opacity, scale]);

  const animatedOrangeProps = useAnimatedProps(() => ({
    strokeDashoffset: orangeProgress.value,
    fillOpacity: fillProgress.value,
    strokeWidth: 8 - (fillProgress.value * 8), // fade out stroke as fill comes in
  }));

  const animatedBlueProps = useAnimatedProps(() => ({
    strokeDashoffset: blueProgress.value,
    fillOpacity: fillProgress.value,
    strokeWidth: 8 - (fillProgress.value * 8),
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Svg viewBox="0 0 400 200" width="80%" height="30%">
        <Defs>
          <LinearGradient id="orangeGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#F26D21" />
            <Stop offset="1" stopColor="#FF9B42" />
          </LinearGradient>
          <LinearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#0F4E8B" />
            <Stop offset="1" stopColor="#1A73E8" />
          </LinearGradient>
        </Defs>

        <AnimatedPath
          d="M 40 140 C 120 180, 150 90, 250 140 C 220 160, 180 150, 140 130 C 100 110, 60 150, 40 140 Z"
          fill="url(#orangeGrad)"
          stroke="url(#orangeGrad)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1000"
          animatedProps={animatedOrangeProps}
        />

        <AnimatedPath
          d="M 140 130 C 180 70, 240 70, 320 140 C 350 170, 280 40, 170 80 C 160 85, 150 110, 140 130 Z"
          fill="url(#blueGrad)"
          stroke="url(#blueGrad)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1000"
          animatedProps={animatedBlueProps}
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
});
