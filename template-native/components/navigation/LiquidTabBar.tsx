import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView, type BlurTint } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import {
  ChartBarSquareIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  PencilSquareIcon,
  PlusIcon,
  SparklesIcon,
  UserIcon
} from 'react-native-heroicons/outline';

import { useColorScheme } from '@/components/useColorScheme';
import { Text } from '@/components/Themed';
import { useAddTodoModal, useChatOverlay, useSchedules } from '@/contexts';
import { useThemedColors } from '@/lib/utils';

const TAB_BAR_HEIGHT = 62;
const FAB_SIZE = 62;
const CONTROL_GAP = 14;
const HORIZONTAL_MARGIN = 16;
const ACTION_SPACING = 12;
const EXTRA_CONTENT_CLEARANCE = 30;

const MENU_SPRING = {
  damping: 16,
  mass: 0.8,
  stiffness: 210
} as const;

const isIos = Platform.OS === 'ios';
const blurMethod = Platform.OS === 'android' ? 'dimezisBlurView' : undefined;

export const getLiquidTabBarBottomOffset = (bottomInset: number) => Math.max(bottomInset - 8, 12);

export const getLiquidTabBarContentInset = (bottomInset: number) =>
  getLiquidTabBarBottomOffset(bottomInset) +
  Math.max(TAB_BAR_HEIGHT, FAB_SIZE) +
  EXTRA_CONTENT_CLEARANCE;

type GlassPalette = {
  tint: BlurTint;
  baseFill: string;
  overlay: string;
  border: string;
  highlight: string;
  activeFill: string;
  activeBorder: string;
  fabFill: string;
  labelFill: string;
  scrim: string;
};

type GlassSurfaceProps = {
  children: ReactNode;
  palette: GlassPalette;
  radius: number;
  style?: StyleProp<ViewStyle>;
};

type TabIconProps = {
  color: string;
  focused: boolean;
  routeName: string;
};

type ActionItem = {
  key: string;
  label: string;
  Icon: typeof PencilSquareIcon;
  onPress: () => void;
};

type ActionRowProps = {
  action: ActionItem;
  index: number;
  progress: SharedValue<number>;
  palette: GlassPalette;
  isDark: boolean;
  tintColor: string;
};

const getGlassPalette = (isDark: boolean): GlassPalette => ({
  tint: isDark ? 'systemChromeMaterialDark' : 'systemUltraThinMaterialLight',
  baseFill: isDark ? 'rgba(2, 6, 23, 0.72)' : 'rgba(255, 255, 255, 0.24)',
  overlay: isDark ? 'rgba(15, 23, 42, 0.42)' : 'rgba(255, 255, 255, 0.54)',
  border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.72)',
  highlight: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.88)',
  activeFill: isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(255, 255, 255, 0.48)',
  activeBorder: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.76)',
  fabFill: isDark ? 'rgba(96, 165, 250, 0.16)' : 'rgba(59, 130, 246, 0.12)',
  labelFill: isDark ? 'rgba(15, 23, 42, 0.58)' : 'rgba(255, 255, 255, 0.42)',
  scrim: isDark ? 'rgba(2, 6, 23, 0.42)' : 'rgba(15, 23, 42, 0.08)'
});

const GlassSurface = ({ children, palette, radius, style }: GlassSurfaceProps) => {
  return (
    <View style={style}>
      <View style={[styles.glassClip, { borderRadius: radius }]}>
        <View
          pointerEvents='none'
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: palette.baseFill,
              borderRadius: radius
            }
          ]}
        />
        <BlurView
          intensity={92}
          tint={palette.tint}
          experimentalBlurMethod={blurMethod}
          style={StyleSheet.absoluteFill}
        />
        <View
          pointerEvents='none'
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: palette.overlay,
              borderRadius: radius
            }
          ]}
        />
        <View
          pointerEvents='none'
          style={[
            StyleSheet.absoluteFill,
            {
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: palette.border,
              borderRadius: radius
            }
          ]}
        />
        <View
          pointerEvents='none'
          style={[
            styles.glassHighlight,
            {
              borderRadius: radius,
              borderTopColor: palette.highlight
            }
          ]}
        />
        {children}
      </View>
    </View>
  );
};

const TabIcon = ({ color, focused, routeName }: TabIconProps) => {
  const strokeWidth = focused ? 2.2 : 1.9;

  switch (routeName) {
    case 'home':
      return <ClipboardDocumentListIcon size={20} color={color} strokeWidth={strokeWidth} />;
    case 'dashboard':
      return <ChartBarSquareIcon size={20} color={color} strokeWidth={strokeWidth} />;
    case 'profile':
      return <UserIcon size={20} color={color} strokeWidth={strokeWidth} />;
    default:
      return <CheckCircleIcon size={20} color={color} strokeWidth={strokeWidth} />;
  }
};

const ActionRow = ({ action, index, progress, palette, isDark, tintColor }: ActionRowProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    const start = index * 0.12;
    const normalized = Math.min(Math.max((progress.value - start) / (1 - start), 0), 1);

    return {
      opacity: normalized,
      transform: [
        { translateY: interpolate(normalized, [0, 1], [18 + index * 6, 0]) },
        { scale: interpolate(normalized, [0, 1], [0.9, 1]) }
      ]
    };
  }, [index]);

  return (
    <Animated.View style={[styles.actionRow, animatedStyle]} pointerEvents='box-none'>
      <GlassSurface
        palette={{ ...palette, overlay: palette.labelFill }}
        radius={20}
        style={[
          styles.actionLabelShell,
          isDark ? styles.actionShadowDark : styles.actionShadowLight
        ]}
      >
        <View style={styles.actionLabelContent}>
          <Text style={[styles.actionLabel, { color: isDark ? '#f8fafc' : '#111827' }]}>
            {action.label}
          </Text>
        </View>
      </GlassSurface>

      <GlassSurface
        palette={palette}
        radius={22}
        style={[styles.actionButtonShell, isDark ? styles.fabShadowDark : styles.fabShadowLight]}
      >
        <Pressable
          accessibilityRole='button'
          accessibilityLabel={action.label}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.12)', borderless: true }}
          onPress={action.onPress}
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
        >
          <action.Icon size={18} color={tintColor} strokeWidth={2} />
        </Pressable>
      </GlassSurface>
    </Animated.View>
  );
};

export const LiquidTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const router = useRouter();
  const colors = useThemedColors();
  const colorScheme = useColorScheme() ?? 'dark';
  const isDark = colorScheme === 'dark';
  const palette = useMemo(() => getGlassPalette(isDark), [isDark]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { show: showAddTodo } = useAddTodoModal();
  const { isVisible: isChatVisible, toggle: toggleChat } = useChatOverlay();
  const { createSchedule } = useSchedules();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const menuProgress = useSharedValue(0);
  const barVisibility = useSharedValue(1);

  const bottomOffset = getLiquidTabBarBottomOffset(insets.bottom);
  const pillWidth = Math.min(width - HORIZONTAL_MARGIN * 2 - FAB_SIZE - CONTROL_GAP, 336);
  const dockWidth = pillWidth + CONTROL_GAP + FAB_SIZE;
  const shouldHideBar = isKeyboardVisible || isChatVisible;

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const actions = useMemo<ActionItem[]>(
    () => [
      {
        key: 'compose',
        label: 'New post',
        Icon: PencilSquareIcon,
        onPress: () => {
          closeMenu();
          router.push('/compose');
        }
      },
      {
        key: 'todo',
        label: 'New todo',
        Icon: CheckCircleIcon,
        onPress: () => {
          closeMenu();
          showAddTodo();
        }
      },
      {
        key: 'schedule',
        label: 'New schedule',
        Icon: CalendarDaysIcon,
        onPress: () => {
          closeMenu();
          void createSchedule({
            title: 'Untitled Schedule',
            emoji: '📅',
            description: undefined,
            mode: 'day',
            visibility: 'private',
            frequency: 'daily',
            todoDefs: [],
            isActive: true
          }).then((schedule) => {
            router.push({
              pathname: '/(drawer)/apps/schedules',
              params: { scheduleId: schedule.id }
            });
          });
        }
      },
      {
        key: 'chat',
        label: 'AI chat',
        Icon: SparklesIcon,
        onPress: () => {
          closeMenu();
          toggleChat();
        }
      }
    ],
    [closeMenu, createSchedule, router, showAddTodo, toggleChat]
  );

  useEffect(() => {
    const showEvent = isIos ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = isIos ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (shouldHideBar && isMenuOpen) {
      closeMenu();
    }
  }, [closeMenu, isMenuOpen, shouldHideBar]);

  useEffect(() => {
    menuProgress.value = isMenuOpen
      ? withSpring(1, MENU_SPRING)
      : withTiming(0, { duration: 180, easing: Easing.out(Easing.quad) });
  }, [isMenuOpen, menuProgress]);

  useEffect(() => {
    barVisibility.value = withTiming(shouldHideBar ? 0 : 1, {
      duration: 200,
      easing: Easing.out(Easing.quad)
    });
  }, [barVisibility, shouldHideBar]);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(menuProgress.value, [0, 1], [0, 1])
  }));

  const barAnimatedStyle = useAnimatedStyle(() => ({
    opacity: barVisibility.value,
    transform: [{ translateY: interpolate(barVisibility.value, [0, 1], [120, 0]) }]
  }));

  const fabIconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(menuProgress.value, [0, 1], [0, 45])}deg` }]
  }));

  return (
    <View pointerEvents='box-none' style={StyleSheet.absoluteFill}>
      <Animated.View
        pointerEvents={isMenuOpen ? 'auto' : 'none'}
        style={[styles.scrim, { backgroundColor: palette.scrim }, overlayAnimatedStyle]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
      </Animated.View>

      <Animated.View
        pointerEvents={shouldHideBar ? 'none' : 'box-none'}
        style={[styles.bottomDockContainer, { bottom: bottomOffset }, barAnimatedStyle]}
      >
        <View style={[styles.dockShell, { width: dockWidth }]} pointerEvents='box-none'>
          <View style={[styles.actionsStack, { bottom: FAB_SIZE + ACTION_SPACING }]}>
            {actions.map((action, index) => (
              <ActionRow
                key={action.key}
                action={action}
                index={index}
                progress={menuProgress}
                palette={palette}
                isDark={isDark}
                tintColor={colors.tint}
              />
            ))}
          </View>

          <View style={styles.controlsRow}>
            <GlassSurface
              palette={palette}
              radius={TAB_BAR_HEIGHT / 2}
              style={[
                styles.pillShadow,
                isDark ? styles.pillShadowDark : styles.pillShadowLight,
                { width: pillWidth, height: TAB_BAR_HEIGHT }
              ]}
            >
              <View style={styles.tabPillContent}>
                {state.routes.map((route, index) => {
                  const descriptor = descriptors[route.key];
                  const { options } = descriptor;
                  const label =
                    typeof options.tabBarLabel === 'string'
                      ? options.tabBarLabel
                      : typeof options.title === 'string'
                        ? options.title
                        : route.name;

                  const isFocused = state.index === index;

                  const onPress = () => {
                    const event = navigation.emit({
                      type: 'tabPress',
                      target: route.key,
                      canPreventDefault: true
                    });

                    if (!isFocused && !event.defaultPrevented) {
                      navigation.navigate(route.name, route.params);
                    }
                  };

                  const onLongPress = () => {
                    navigation.emit({
                      type: 'tabLongPress',
                      target: route.key
                    });
                  };

                  return (
                    <Pressable
                      key={route.key}
                      accessibilityRole='button'
                      accessibilityLabel={options.tabBarAccessibilityLabel}
                      accessibilityState={isFocused ? { selected: true } : {}}
                      android_ripple={{ color: 'rgba(255, 255, 255, 0.12)', borderless: false }}
                      onLongPress={onLongPress}
                      onPress={onPress}
                      style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}
                      testID={options.tabBarButtonTestID}
                    >
                      <View style={styles.tabButtonInner}>
                        <TabIcon
                          color={isFocused ? colors.tint : colors.textMuted}
                          focused={isFocused}
                          routeName={route.name}
                        />
                        <Text
                          style={[
                            styles.tabLabel,
                            { color: isFocused ? colors.text : colors.textMuted },
                            isFocused && styles.tabLabelActive
                          ]}
                        >
                          {label}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </GlassSurface>

            <GlassSurface
              palette={{ ...palette, overlay: palette.fabFill }}
              radius={FAB_SIZE / 2}
              style={[
                styles.fabShadow,
                isDark ? styles.fabShadowDark : styles.fabShadowLight,
                { width: FAB_SIZE, height: FAB_SIZE }
              ]}
            >
              <Pressable
                accessibilityHint='Opens quick actions'
                accessibilityLabel='Create'
                accessibilityRole='button'
                android_ripple={{ color: 'rgba(255, 255, 255, 0.14)', borderless: true }}
                onPress={() => setIsMenuOpen((value) => !value)}
                style={({ pressed }) => [styles.fabButton, pressed && styles.pressed]}
              >
                <Animated.View style={fabIconAnimatedStyle}>
                  <PlusIcon size={24} color={colors.tint} strokeWidth={2.25} />
                </Animated.View>
              </Pressable>
            </GlassSurface>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject
  },
  bottomDockContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center'
  },
  dockShell: {
    alignItems: 'flex-end'
  },
  controlsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: CONTROL_GAP
  },
  actionsStack: {
    position: 'absolute',
    right: 0,
    alignItems: 'flex-end',
    gap: ACTION_SPACING
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  actionLabelShell: {
    minHeight: 40
  },
  actionLabelContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center'
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2
  },
  actionButtonShell: {
    width: 44,
    height: 44
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  glassClip: {
    flex: 1,
    overflow: 'hidden',
    borderCurve: 'continuous'
  },
  glassHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'transparent'
  },
  pillShadow: {
    flexShrink: 0
  },
  pillShadowLight: {
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8
  },
  pillShadowDark: {
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.42,
    shadowRadius: 28,
    elevation: 10
  },
  fabShadow: {
    flexShrink: 0
  },
  fabShadowLight: {
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10
  },
  fabShadowDark: {
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.48,
    shadowRadius: 28,
    elevation: 12
  },
  actionShadowLight: {
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 6
  },
  actionShadowDark: {
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.34,
    shadowRadius: 20,
    elevation: 8
  },
  tabPillContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 6
  },
  tabButton: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderCurve: 'continuous'
  },
  tabButtonInner: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 4,
    borderCurve: 'continuous'
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.1
  },
  tabLabelActive: {
    fontWeight: '700'
  },
  fabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pressed: {
    opacity: 0.88
  }
});
