import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions, Image } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Props {
  onAnimationFinish?: () => void;
}

export default function AnimatedSplashScreen({ onAnimationFinish }: Props) {
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoFloatAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // The master opacity for fading out the ENTIRE splash screen at the end
  const containerFadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Initial pop-in
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start(() => {
      // 2. Start looping float & loading bar, and show text
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoFloatAnim, { toValue: -15, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(logoFloatAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();

      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: false,
      }).start();

      Animated.timing(textFadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();

      // 3. Keep it alive for a few seconds, then fade out the whole component
      setTimeout(() => {
        Animated.timing(containerFadeOut, {
          toValue: 0,
          duration: 500, // smooth fade out
          useNativeDriver: true,
        }).start(() => {
          setIsAnimationComplete(true);
          if (onAnimationFinish) {
            onAnimationFinish();
          }
        });
      }, 3000);
    });
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  if (isAnimationComplete) return null;

  return (
    <Animated.View style={[styles.container, { opacity: containerFadeOut }]}>
      {/* Background elements */}
      <View style={styles.bgLayer1} />
      <View style={styles.bgLayer2} />

      {/* Main Logo */}
      <Animated.View style={[styles.logoWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: logoFloatAnim }] }]}>
        <Image source={require('../../assets/images/logo1.png')} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      {/* Loading Bar & Text */}
      <Animated.View style={[styles.bottomSection, { opacity: textFadeAnim }]}>
        <Text style={styles.slogan}>Experience Premium Travel</Text>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000080',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999999, // Ensure it sits on top of everything
  },
  bgLayer1: {
    position: 'absolute', top: -150, right: -100,
    width: 400, height: 400, borderRadius: 200,
    backgroundColor: 'rgba(255,184,28,0.06)',
  },
  bgLayer2: {
    position: 'absolute', bottom: -100, left: -120,
    width: 350, height: 350, borderRadius: 175,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  logoWrap: {
    width: 220,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  bottomSection: {
    position: 'absolute',
    bottom: height * 0.15,
    alignItems: 'center',
    width: '100%',
  },
  slogan: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  progressBarBg: {
    width: width * 0.5,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFB81C',
    borderRadius: 2,
  }
});
