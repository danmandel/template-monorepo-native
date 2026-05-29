import { Icon, FontAwesome } from '@/components/ui/Icon';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getLiquidTabBarContentInset } from '@/components/navigation';
import { Text } from '@/components/Themed';
import { useTheme, type ThemePreference, type TimeFormatPreference } from '@/contexts';
import { useSupabaseContext } from '@/lib/supabase';
import { syncToCloud, type SyncResult } from '@/lib/supabase/sync';
import { useThemedColors } from '@/lib/utils';

type AuthMode = 'sign-in' | 'sign-up';

const AuthForm = () => {
  const colors = useThemedColors();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useSupabaseContext();

  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmailSheetVisible, setIsEmailSheetVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(320)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isEmailSheetVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    } else {
      slideAnim.setValue(320);
      backdropAnim.setValue(0);
    }
  }, [isEmailSheetVisible, slideAnim, backdropAnim]);

  const openEmailSheet = () => {
    setError(null);
    setIsEmailSheetVisible(true);
  };

  const closeEmailSheet = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 320,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => {
      setIsEmailSheetVisible(false);
      setError(null);
    });
  };

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'sign-in') {
        const { error: authError } = await signInWithEmail(email, password);
        if (authError) {
          setError(authError.message);
        } else {
          closeEmailSheet();
        }
      } else {
        const { error: authError } = await signUpWithEmail(email, password, {
          full_name: fullName || undefined
        });
        if (authError) {
          setError(authError.message);
        } else {
          closeEmailSheet();
          Alert.alert('Check your email', 'We sent you a confirmation link to verify your email.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);

    try {
      const { error: authError } = await signInWithGoogle();
      if (authError) setError(authError.message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
    setError(null);
  };

  return (
    <>
      <View
        style={[
          styles.authContainer,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border
          }
        ]}
      >
        <View style={[styles.authBadge, { backgroundColor: `${colors.tint}15` }]}>
          <Icon name='cloud-upload' size={18} color={colors.tint} />
        </View>

        <Text style={[styles.authTitle, { color: colors.text }]}>Sync your daily flow</Text>

        <Text style={[styles.authSubtitle, { color: colors.textMuted }]}>
          Start with Google for the fastest setup. Email is still available if you prefer a manual
          sign-in.
        </Text>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: `${colors.negative}10` }]}>
            <Text style={[styles.errorText, { color: colors.negative }]}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.googleButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.border
            }
          ]}
          onPress={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
          activeOpacity={0.8}
        >
          {isGoogleLoading ? (
            <ActivityIndicator color={colors.textMuted} size='small' />
          ) : (
            <>
              <FontAwesome name='google' size={16} color='#EA4335' style={styles.googleIcon} />
              <Text style={[styles.googleButtonText, { color: colors.text }]}>
                Continue with Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.emailOptionButton, { borderColor: colors.border }]}
          onPress={openEmailSheet}
          disabled={isLoading || isGoogleLoading}
          activeOpacity={0.8}
        >
          <View style={[styles.emailOptionIcon, { backgroundColor: `${colors.tint}10` }]}>
            <Icon name='envelope-o' size={16} color={colors.tint} />
          </View>
          <View style={styles.emailOptionCopy}>
            <Text style={[styles.emailOptionTitle, { color: colors.text }]}>Use email instead</Text>
            <Text style={[styles.emailOptionSubtitle, { color: colors.textMuted }]}>
              Sign in or create an account manually
            </Text>
          </View>
          <Icon name='chevron-right' size={12} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isEmailSheetVisible}
        transparent
        animationType='none'
        onRequestClose={closeEmailSheet}
      >
        <KeyboardAvoidingView
          style={sheetStyles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableWithoutFeedback onPress={closeEmailSheet}>
            <Animated.View
              style={[
                sheetStyles.backdrop,
                {
                  opacity: backdropAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.5]
                  })
                }
              ]}
            />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              sheetStyles.sheet,
              {
                backgroundColor: colors.background,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={sheetStyles.handle} />

            <View style={styles.authSheetHeader}>
              <View style={styles.authSheetHeaderCopy}>
                <Text style={[styles.authSheetTitle, { color: colors.text }]}>
                  {mode === 'sign-in' ? 'Continue with email' : 'Create your account'}
                </Text>
                <Text style={[styles.authSheetSubtitle, { color: colors.textMuted }]}>
                  {mode === 'sign-in'
                    ? 'Use your email and password without cluttering the main profile view.'
                    : 'Create an email account for syncing across devices.'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeEmailSheet}
                style={[
                  styles.authSheetCloseButton,
                  { backgroundColor: colors.backgroundSecondary }
                ]}
                activeOpacity={0.7}
              >
                <Icon name='times' size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={[styles.authModeSwitch, { backgroundColor: colors.backgroundSecondary }]}>
              <TouchableOpacity
                style={[
                  styles.authModeButton,
                  mode === 'sign-in' && {
                    backgroundColor: colors.card,
                    borderColor: colors.border
                  }
                ]}
                onPress={() => {
                  if (mode !== 'sign-in') toggleMode();
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.authModeText,
                    { color: mode === 'sign-in' ? colors.text : colors.textMuted }
                  ]}
                >
                  Sign in
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.authModeButton,
                  mode === 'sign-up' && {
                    backgroundColor: colors.card,
                    borderColor: colors.border
                  }
                ]}
                onPress={() => {
                  if (mode !== 'sign-up') toggleMode();
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.authModeText,
                    { color: mode === 'sign-up' ? colors.text : colors.textMuted }
                  ]}
                >
                  Create account
                </Text>
              </TouchableOpacity>
            </View>

            {error && (
              <View style={[styles.errorBox, { backgroundColor: `${colors.negative}10` }]}>
                <Text style={[styles.errorText, { color: colors.negative }]}>{error}</Text>
              </View>
            )}

            {mode === 'sign-up' && (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                    color: colors.text
                  }
                ]}
                placeholder='Name'
                placeholderTextColor={colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize='words'
              />
            )}

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                  color: colors.text
                }
              ]}
              placeholder='Email'
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize='none'
              keyboardType='email-address'
              autoComplete='email'
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                  color: colors.text
                }
              ]}
              placeholder='Password'
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.tint }]}
              onPress={handleSubmit}
              disabled={isLoading || isGoogleLoading || !email || !password}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color='#fff' size='small' />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === 'sign-in' ? 'Sign in' : 'Create account'}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const SyncSection = () => {
  const colors = useThemedColors();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<SyncResult | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncToCloud();
      setLastSync(result);
      if (result.success) {
        Alert.alert(
          'Sync Complete',
          `Uploaded: ${result.stats?.todosUploaded ?? 0} todos, ${result.stats?.schedulesUploaded ?? 0} schedules\nDownloaded: ${result.stats?.todosDownloaded ?? 0} todos, ${result.stats?.schedulesDownloaded ?? 0} schedules`
        );
      } else {
        Alert.alert('Sync Failed', result.error ?? 'Unknown error');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>CLOUD SYNC</Text>

      <TouchableOpacity
        style={[styles.menuItem, { borderBottomColor: colors.border }]}
        onPress={handleSync}
        disabled={isSyncing}
      >
        <View style={[styles.menuIcon, { backgroundColor: `${colors.tint}15` }]}>
          {isSyncing ? (
            <ActivityIndicator size='small' color={colors.tint} />
          ) : (
            <Icon name='cloud-upload' size={18} color={colors.tint} />
          )}
        </View>
        <View style={styles.menuContent}>
          <Text style={[styles.menuText, { color: colors.text }]}>
            {isSyncing ? 'Syncing...' : 'Sync to Cloud'}
          </Text>
          {lastSync?.success && (
            <Text style={[styles.menuSubtext, { color: colors.positive }]}>
              Last sync successful
            </Text>
          )}
        </View>
        {!isSyncing && <Icon name='refresh' size={14} color={colors.textMuted} />}
      </TouchableOpacity>
    </View>
  );
};

const APPEARANCE_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'system', label: 'System', icon: 'mobile' },
  { value: 'light', label: 'Light', icon: 'sun-o' },
  { value: 'dark', label: 'Dark', icon: 'moon-o' }
];

const APPEARANCE_LABELS: Record<ThemePreference, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark'
};

const CLOCK_STYLE_OPTIONS: { value: TimeFormatPreference; label: string; icon: string }[] = [
  { value: '12h', label: '12-hour', icon: 'clock-o' },
  { value: '24h', label: '24-hour', icon: 'history' }
];

const CLOCK_STYLE_LABELS: Record<TimeFormatPreference, string> = {
  '12h': '12-hour',
  '24h': '24-hour'
};

const AppearanceSection = () => {
  const colors = useThemedColors();
  const { themePreference, setThemePreference, timeFormatPreference, setTimeFormatPreference } =
    useTheme();
  const [activeSheet, setActiveSheet] = useState<'appearance' | 'clockStyle' | null>(null);

  const slideAnim = useRef(new Animated.Value(300)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const isSheetVisible = activeSheet !== null;

  useEffect(() => {
    if (isSheetVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    } else {
      slideAnim.setValue(300);
      backdropAnim.setValue(0);
    }
  }, [isSheetVisible, slideAnim, backdropAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => {
      setActiveSheet(null);
    });
  };

  const handleSelectAppearance = (value: ThemePreference) => {
    setThemePreference(value);
    handleClose();
  };

  const handleSelectClockStyle = (value: TimeFormatPreference) => {
    setTimeFormatPreference(value);
    handleClose();
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SETTINGS</Text>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setActiveSheet('appearance')}
        activeOpacity={0.7}
      >
        <View style={[styles.menuIcon, { backgroundColor: `${colors.tint}15` }]}>
          <Icon name='paint-brush' size={18} color={colors.tint} />
        </View>
        <Text style={[styles.menuText, { color: colors.text }]}>Theme</Text>
        <Text style={[styles.settingValue, { color: colors.textMuted }]}>
          {APPEARANCE_LABELS[themePreference]}
        </Text>
        <Icon name='chevron-right' size={12} color={colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setActiveSheet('clockStyle')}
        activeOpacity={0.7}
      >
        <View style={[styles.menuIcon, { backgroundColor: `${colors.tint}15` }]}>
          <Icon name='clock-o' size={18} color={colors.tint} />
        </View>
        <Text style={[styles.menuText, { color: colors.text }]}>Clock Style</Text>
        <Text style={[styles.settingValue, { color: colors.textMuted }]}>
          {CLOCK_STYLE_LABELS[timeFormatPreference]}
        </Text>
        <Icon name='chevron-right' size={12} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={isSheetVisible} transparent animationType='none' onRequestClose={handleClose}>
        <View style={sheetStyles.container}>
          <TouchableWithoutFeedback onPress={handleClose}>
            <Animated.View
              style={[
                sheetStyles.backdrop,
                {
                  opacity: backdropAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.5]
                  })
                }
              ]}
            />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              sheetStyles.sheet,
              {
                backgroundColor: colors.background,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={sheetStyles.handle} />

            <Text style={[sheetStyles.title, { color: colors.text }]}>
              {activeSheet === 'clockStyle' ? 'Clock Style' : 'Appearance'}
            </Text>

            {activeSheet === 'appearance' &&
              APPEARANCE_OPTIONS.map((option) => {
                const isActive = themePreference === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={sheetStyles.option}
                    onPress={() => handleSelectAppearance(option.value)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.menuIcon,
                        { backgroundColor: isActive ? `${colors.tint}15` : `${colors.textMuted}10` }
                      ]}
                    >
                      <Icon
                        name={option.icon as any}
                        size={18}
                        color={isActive ? colors.tint : colors.textMuted}
                      />
                    </View>
                    <Text
                      style={[
                        sheetStyles.optionText,
                        {
                          color: isActive ? colors.tint : colors.text,
                          fontWeight: isActive ? '600' : '400'
                        }
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isActive && <Icon name='check' size={16} color={colors.tint} />}
                  </TouchableOpacity>
                );
              })}

            {activeSheet === 'clockStyle' &&
              CLOCK_STYLE_OPTIONS.map((option) => {
                const isActive = timeFormatPreference === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={sheetStyles.option}
                    onPress={() => handleSelectClockStyle(option.value)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.menuIcon,
                        { backgroundColor: isActive ? `${colors.tint}15` : `${colors.textMuted}10` }
                      ]}
                    >
                      <Icon
                        name={option.icon as any}
                        size={18}
                        color={isActive ? colors.tint : colors.textMuted}
                      />
                    </View>
                    <Text
                      style={[
                        sheetStyles.optionText,
                        {
                          color: isActive ? colors.tint : colors.text,
                          fontWeight: isActive ? '600' : '400'
                        }
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isActive && <Icon name='check' size={16} color={colors.tint} />}
                  </TouchableOpacity>
                );
              })}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export const ProfileScreen = () => {
  const colors = useThemedColors();
  const insets = useSafeAreaInsets();
  const bottomContentInset = getLiquidTabBarContentInset(insets.bottom);
  const router = useRouter();
  const { profile, user, signOut } = useSupabaseContext();

  const isAuthenticated = !!user;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top, paddingBottom: bottomContentInset }
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header - Simplified */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarInitial}>
              {isAuthenticated
                ? (profile?.full_name ?? profile?.email ?? 'U')[0].toUpperCase()
                : '?'}
            </Text>
          )}
        </View>
        <Text style={[styles.displayName, { color: colors.text }]}>
          {isAuthenticated ? (profile?.full_name ?? 'User') : 'Guest'}
        </Text>
        {isAuthenticated && (
          <Text style={[styles.email, { color: colors.textMuted }]}>
            {profile?.email ?? user?.email}
          </Text>
        )}
      </View>

      {/* Sync section for authenticated users */}
      {isAuthenticated && <SyncSection />}

      {/* Appearance */}
      <AppearanceSection />

      {/* Quick links - Simplified */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(drawer)/apps/schedules')}
          activeOpacity={0.7}
        >
          <Text style={[styles.menuText, { color: colors.text }]}>Schedules</Text>
          <Icon name='chevron-right' size={12} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(drawer)/apps/calendar')}
          activeOpacity={0.7}
        >
          <Text style={[styles.menuText, { color: colors.text }]}>Calendar</Text>
          <Icon name='chevron-right' size={12} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {isAuthenticated && (
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem} onPress={handleSignOut} activeOpacity={0.7}>
            <Text style={[styles.menuText, { color: colors.negative }]}>Sign out</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Auth form for unauthenticated users */}
      {!isAuthenticated && <AuthForm />}
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    paddingBottom: 120
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.5
  },
  displayName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: -0.3
  },
  email: {
    fontSize: 14,
    letterSpacing: -0.2
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 8
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  menuContent: {
    flex: 1
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.2
  },
  menuSubtext: {
    fontSize: 13,
    marginTop: 2,
    letterSpacing: -0.1
  },
  // Auth form styles
  authContainer: {
    marginHorizontal: 20,
    marginTop: 4,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderCurve: 'continuous'
  },
  authBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  authTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: -0.4,
    textAlign: 'left'
  },
  authSubtitle: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 20,
    letterSpacing: -0.2,
    textAlign: 'left'
  },
  errorBox: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderCurve: 'continuous'
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: -0.2
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
    borderCurve: 'continuous',
    letterSpacing: -0.2
  },
  submitButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    borderCurve: 'continuous'
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2
  },
  googleButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    borderCurve: 'continuous'
  },
  googleIcon: {
    marginRight: 8
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2
  },
  emailOptionButton: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderCurve: 'continuous'
  },
  emailOptionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  emailOptionCopy: {
    flex: 1,
    marginRight: 12
  },
  emailOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 2
  },
  emailOptionSubtitle: {
    fontSize: 13,
    letterSpacing: -0.1,
    lineHeight: 18
  },
  authSheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18
  },
  authSheetHeaderCopy: {
    flex: 1,
    paddingRight: 12
  },
  authSheetTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 6
  },
  authSheetSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.2
  },
  authSheetCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center'
  },
  authModeSwitch: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    marginBottom: 16,
    borderCurve: 'continuous'
  },
  authModeButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous'
  },
  authModeText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2
  },
  settingValue: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.2,
    marginRight: 8
  }
});

const sheetStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000'
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderCurve: 'continuous'
  },
  handle: {
    width: 32,
    height: 4,
    backgroundColor: 'rgba(128,128,128,0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 20
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 16
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    letterSpacing: -0.2
  }
});
