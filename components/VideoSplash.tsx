import React, { useRef, useState } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as SplashScreen from 'expo-splash-screen';

interface VideoSplashProps {
  onComplete: () => void;
}

export default function VideoSplash({ onComplete }: VideoSplashProps) {
  const [opacity] = useState(new Animated.Value(1));
  const [isReady, setIsReady] = useState(false);
  const video = useRef<Video>(null);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      if (!isReady && status.isPlaying) {
        setIsReady(true);
        // Hide the native splash screen as soon as the video starts playing
        SplashScreen.hideAsync().catch(() => {});
      }

      if (status.didJustFinish) {
        // Smoothly fade out the video screen to 0 opacity
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500, // Smooth transition
          useNativeDriver: true,
        }).start(() => {
          // Tell the parent layout to unmount this component and render the app
          onComplete();
        });
      }
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Video
        ref={video}
        style={styles.video}
        source={require('../assets/videos/loading.mp4')}
        shouldPlay
        resizeMode={ResizeMode.CONTAIN}
        isLooping={false}
        useNativeControls={false}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onError={(e) => {
          console.warn('Video failed to load:', e);
          // Fallback just in case video fails
          SplashScreen.hideAsync().catch(() => {});
          onComplete();
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
  video: {
    ...StyleSheet.absoluteFillObject,
  },
});
