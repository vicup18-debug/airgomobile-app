import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, 
  Easing, 
  runOnJS 
} from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';

interface AnimatedSplashProps {
  onComplete: () => void;
}

export default function AnimatedSplash({ onComplete }: AnimatedSplashProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    // Hide the native static splash screen immediately so our animated one takes over
    SplashScreen.hideAsync().catch(() => {});

    // Phase 1: Majestic Fade In & Scale Up (The "Breathe In")
    opacity.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.exp) });
    scale.value = withTiming(1, { duration: 2500, easing: Easing.out(Easing.ease) });

    // Phase 2: The "Zoom Out" Exit Transition
    setTimeout(() => {
      // Scale down slightly then pop out
      scale.value = withTiming(1.1, { duration: 600, easing: Easing.in(Easing.exp) }); 
      opacity.value = withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) });
      
      containerOpacity.value = withDelay(300, withTiming(0, { duration: 400 }, (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      }));
    }, 2500);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.Image 
        // We use the exact logo image provided
        source={require('../assets/images/splash-logo.png')} 
        style={[styles.logo, logoStyle]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff', // Ensures a seamless transition with the white background of your logo
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  logo: {
    width: 220,
    height: 220,
  },
});
