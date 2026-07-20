import React, { useRef, useState } from 'react';
import { StyleSheet, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import * as SplashScreen from 'expo-splash-screen';

interface LottieSplashProps {
  onComplete: () => void;
}

export default function LottieSplash({ onComplete }: LottieSplashProps) {
  const [opacity] = useState(new Animated.Value(1));
  const animation = useRef<LottieView>(null);

  const handleAnimationFinish = () => {
    // Smoothly fade out the Lottie screen to 0 opacity
    Animated.timing(opacity, {
      toValue: 0,
      duration: 400, // Smooth transition
      useNativeDriver: true,
    }).start(() => {
      onComplete();
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <LottieView
        autoPlay
        loop={false}
        ref={animation}
        style={styles.lottie}
        // User needs to drop their splash.json here
        source={require('../assets/lottie/splash.json')}
        onAnimationFinish={handleAnimationFinish}
        onAnimationLoaded={() => {
          // Hide native splash once Lottie is ready to render
          SplashScreen.hideAsync().catch(() => {});
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff', // App native splash color
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  lottie: {
    width: 250,
    height: 250,
  },
});
