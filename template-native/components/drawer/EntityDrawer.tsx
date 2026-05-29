import { Icon } from '@/components/ui/Icon';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useSupabaseContext } from '@/lib/supabase';
import { useThemedColors } from '@/lib/utils';

// Custom calendar icon that shows the current day
const CalendarIcon = ({ size, color }: { size: number; color: string }) => {
  const day = new Date().getDate();
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name='calendar-o' size={size} color={color} />
      <Text
        style={{
          position: 'absolute',
          fontSize: size * 0.5,
          fontWeight: '800',
          color,
          top: size * 0.35
        }}
      >
        {day}
      </Text>
    </View>
  );
};

type NavItem = {
  id: string;
  name: string;
  icon: string;
  customIcon?: 'calendar';
  route: string;
};

const MAIN_NAV: NavItem[] = [
  {
    id: 'schedules',
    name: 'Schedules',
    icon: 'clock-o',
    route: '/(drawer)/apps/schedules'
  },
  {
    id: 'calendar',
    name: 'Calendar',
    icon: 'calendar-o',
    customIcon: 'calendar',
    route: '/(drawer)/apps/calendar'
  },
  {
    id: 'notes',
    name: 'Notes',
    icon: 'sticky-note-o',
    route: '/(drawer)/apps/notes'
  }
];

const TOOLS: NavItem[] = [
  {
    id: 'calculator',
    name: 'Calculator',
    icon: 'calculator',
    route: '/(drawer)/apps/calculator'
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: 'cog',
    route: '/(drawer)/apps/settings'
  }
];

const ProfileBlock = ({ onPress }: { onPress: () => void }) => {
  const colors = useThemedColors();
  const { profile, user } = useSupabaseContext();

  const displayName = profile?.full_name ?? 'User';
  const email = profile?.email ?? user?.email ?? 'Not signed in';
  const avatarUrl = profile?.avatar_url;

  return (
    <TouchableOpacity style={styles.profileBlock} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.profileRow}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.tint }]}>
            <Text style={styles.avatarInitial}>{displayName[0].toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.profileInfo}>
          <Text style={[styles.profileDisplayName, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.profileHandle, { color: colors.textMuted }]}>{email}</Text>
        </View>
        <Icon name='cog' size={18} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
};

const NavItemComponent = ({ item, onPress }: { item: NavItem; onPress: () => void }) => {
  const colors = useThemedColors();

  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress} activeOpacity={0.6}>
      {item.customIcon === 'calendar' ? (
        <CalendarIcon size={18} color={colors.textSecondary} />
      ) : (
        <Icon name={item.icon} size={18} color={colors.textSecondary} />
      )}
      <Text style={[styles.navItemText, { color: colors.text }]}>{item.name}</Text>
    </TouchableOpacity>
  );
};

const NavSection = ({
  title,
  items,
  onItemPress
}: {
  title: string;
  items: NavItem[];
  onItemPress: (item: NavItem) => void;
}) => {
  const colors = useThemedColors();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>
      {items.map((item) => (
        <NavItemComponent key={item.id} item={item} onPress={() => onItemPress(item)} />
      ))}
    </View>
  );
};

export const EntityDrawerContent = ({ navigation }: DrawerContentComponentProps) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemedColors();

  const handleNavPress = (item: NavItem) => {
    navigation.closeDrawer();
    router.push(item.route as any);
  };

  const handleProfilePress = () => {
    navigation.closeDrawer();
    router.push('/(drawer)/(tabs)/profile');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Minimal */}
        <View style={styles.header}>
          <Text style={[styles.logo, { color: colors.text }]}>Dail.ly</Text>
        </View>

        {/* Main Navigation */}
        <NavSection title='' items={MAIN_NAV} onItemPress={handleNavPress} />

        {/* Tools */}
        <NavSection title='' items={TOOLS} onItemPress={handleNavPress} />
      </ScrollView>

      {/* Footer with Profile */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <ProfileBlock onPress={handleProfilePress} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollView: {
    flex: 1
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24
  },
  logo: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3
  },
  profileBlock: {
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  profileInfo: {
    flex: 1
  },
  profileDisplayName: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2
  },
  profileHandle: {
    fontSize: 12,
    letterSpacing: -0.2,
    marginTop: 1
  },
  section: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 4
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    paddingBottom: 8
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 12,
    borderCurve: 'continuous'
  },
  navItemText: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.2
  },
  footer: {
    paddingHorizontal: 8,
    paddingTop: 8
  }
});
