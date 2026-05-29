import { Icon } from '@/components/ui/Icon';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  View
} from 'react-native';

import { Text } from '@/components/Themed';
import { useAddTodoModal, useChatOverlay } from '@/contexts';
import { useThemedColors } from '@/lib/utils';

const TAB_BAR_HEIGHT = 84;
const MINI_FAB_SPACING = 60;
const MINI_FAB_BASE_OFFSET = 16; // Extra spacing from main FAB

type SpeedDialAction = {
  key: string;
  label: string;
  icon: string;
  onPress: () => void;
};

export const ChatFAB = () => {
  const router = useRouter();
  const { isVisible: isChatVisible, toggle: toggleChat } = useChatOverlay();
  const { show: showAddTodo } = useAddTodoModal();
  const colors = useThemedColors();
  const colorScheme = useColorScheme();

  const [isExpanded, setIsExpanded] = useState(false);

  // Animation values
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const miniFabAnims = useRef([
    {
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0.3),
      opacity: new Animated.Value(0)
    },
    {
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0.3),
      opacity: new Animated.Value(0)
    },
    {
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0.3),
      opacity: new Animated.Value(0)
    }
  ]).current;

  const actions: SpeedDialAction[] = [
    {
      key: 'compose',
      label: 'New Post',
      icon: 'pencil',
      onPress: () => {
        collapse();
        router.push('/compose');
      }
    },
    {
      key: 'todo',
      label: 'New Todo',
      icon: 'check-square-o',
      onPress: () => {
        collapse();
        showAddTodo();
      }
    },
    {
      key: 'ai',
      label: 'AI Chat',
      icon: 'magic',
      onPress: () => {
        collapse();
        toggleChat();
      }
    }
  ];

  const expand = () => {
    setIsExpanded(true);

    // Rotate main FAB
    Animated.timing(rotationAnim, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true
    }).start();

    // Fade in backdrop
    Animated.timing(backdropAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true
    }).start();

    // Animate mini FABs with stagger
    miniFabAnims.forEach((anim, index) => {
      const delay = index * 50;
      const targetY = -(MINI_FAB_SPACING * (index + 1) + MINI_FAB_BASE_OFFSET);

      Animated.parallel([
        Animated.timing(anim.translateY, {
          toValue: targetY,
          duration: 200,
          delay,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true
        }),
        Animated.timing(anim.scale, {
          toValue: 1,
          duration: 200,
          delay,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 150,
          delay,
          useNativeDriver: true
        })
      ]).start();
    });
  };

  const collapse = () => {
    // Rotate main FAB back
    Animated.timing(rotationAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true
    }).start();

    // Fade out backdrop
    Animated.timing(backdropAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      setIsExpanded(false);
    });

    // Animate mini FABs back (reverse stagger)
    miniFabAnims.forEach((anim, index) => {
      const delay = (miniFabAnims.length - 1 - index) * 30;

      Animated.parallel([
        Animated.timing(anim.translateY, {
          toValue: 0,
          duration: 150,
          delay,
          useNativeDriver: true
        }),
        Animated.timing(anim.scale, {
          toValue: 0.3,
          duration: 150,
          delay,
          useNativeDriver: true
        }),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 100,
          delay,
          useNativeDriver: true
        })
      ]).start();
    });
  };

  const handleMainFabPress = () => {
    if (isExpanded) {
      collapse();
    } else {
      expand();
    }
  };

  // Reset when chat overlay opens
  useEffect(() => {
    if (isChatVisible && isExpanded) {
      // Instantly reset without animation
      setIsExpanded(false);
      rotationAnim.setValue(0);
      backdropAnim.setValue(0);
      miniFabAnims.forEach((anim) => {
        anim.translateY.setValue(0);
        anim.scale.setValue(0.3);
        anim.opacity.setValue(0);
      });
    }
  }, [isChatVisible, isExpanded, rotationAnim, backdropAnim, miniFabAnims]);

  // Hide FAB when chat overlay is visible
  if (isChatVisible) return null;

  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg']
  });

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <TouchableWithoutFeedback onPress={collapse}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5]
                })
              }
            ]}
          />
        </TouchableWithoutFeedback>
      )}

      <View style={[styles.container, { bottom: TAB_BAR_HEIGHT + 16 }]} pointerEvents='box-none'>
        {/* Mini FABs */}
        {actions.map((action, index) => (
          <Animated.View
            key={action.key}
            style={[
              styles.miniFabRow,
              {
                transform: [
                  { translateY: miniFabAnims[index].translateY },
                  { scale: miniFabAnims[index].scale }
                ],
                opacity: miniFabAnims[index].opacity
              }
            ]}
            pointerEvents={isExpanded ? 'auto' : 'none'}
          >
            <TouchableOpacity
              style={styles.miniFabTouchable}
              onPress={action.onPress}
              activeOpacity={0.8}
            >
              <View style={styles.labelContainer}>
                <BlurView
                  intensity={80}
                  tint={colorScheme === 'dark' ? 'dark' : 'light'}
                  style={styles.labelBlur}
                >
                  <Text style={[styles.label, { color: colors.text }]}>{action.label}</Text>
                </BlurView>
              </View>
              <View style={styles.miniFab}>
                <BlurView
                  intensity={80}
                  tint={colorScheme === 'dark' ? 'dark' : 'light'}
                  style={styles.miniFabBlur}
                >
                  <Icon name={action.icon} size={18} color={colors.tint} />
                </BlurView>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* Main FAB */}
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <TouchableOpacity style={styles.fab} onPress={handleMainFabPress} activeOpacity={0.8}>
            <BlurView
              intensity={80}
              tint={colorScheme === 'dark' ? 'dark' : 'light'}
              style={styles.fabBlur}
            >
              <View style={[styles.fabOverlay, { backgroundColor: `${colors.tint}30` }]}>
                <Icon name='plus' size={20} color={colors.tint} />
              </View>
            </BlurView>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 999
  },
  container: {
    position: 'absolute',
    right: 16,
    zIndex: 1000,
    alignItems: 'flex-end'
  },
  miniFabRow: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    alignItems: 'flex-end'
  },
  miniFabTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  labelContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4
  },
  labelBlur: {
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  label: {
    fontSize: 13,
    fontWeight: '500'
  },
  miniFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    marginRight: 6
  },
  miniFabBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8
  },
  fabBlur: {
    flex: 1
  },
  fabOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
