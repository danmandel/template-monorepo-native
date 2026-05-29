import { Icon } from '@/components/ui/Icon';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useAchievementBanner } from '@/contexts';

const BANNER_HEIGHT = 56;
const BANNER_COLOR = '#1a1a2e'; // deep navy

export const AchievementBanner = () => {
  const insets = useSafeAreaInsets();
  const { isVisible, message } = useAchievementBanner();

  const slideAnim = useRef(new Animated.Value(-BANNER_HEIGHT - insets.top)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Slide in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    } else {
      // Slide out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -BANNER_HEIGHT - insets.top,
          duration: 250,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [isVisible, slideAnim, opacityAnim, insets.top]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          backgroundColor: BANNER_COLOR,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim
        }
      ]}
      pointerEvents='none'
    >
      <View style={styles.content}>
        <Icon name='trophy' size={18} color='#FFD700' />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingBottom: 12,
    paddingHorizontal: 16
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  message: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600'
  }
});
