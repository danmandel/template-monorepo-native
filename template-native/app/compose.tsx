import { Icon } from '@/components/ui/Icon';
import { useRouter } from 'expo-router';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useThemedColors } from '@/lib/utils';

export const ComposeScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemedColors();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>New Post</Text>
        <TouchableOpacity
          style={[styles.postButton, { backgroundColor: colors.tint }]}
          activeOpacity={0.8}
        >
          <Text style={styles.postButtonText}>Post</Text>
        </TouchableOpacity>
      </View>

      {/* Compose Area */}
      <View style={styles.composeArea}>
        <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
          <Icon name='user' size={18} color='#000' />
        </View>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="What's on your mind?"
          placeholderTextColor={colors.textMuted}
          multiline
          autoFocus
          textAlignVertical='top'
        />
      </View>

      {/* Bottom Toolbar */}
      <View
        style={[
          styles.toolbar,
          { borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }
        ]}
      >
        <TouchableOpacity style={styles.toolbarButton}>
          <Icon name='image' size={20} color={colors.tint} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton}>
          <Icon name='bar-chart' size={20} color={colors.tint} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton}>
          <Icon name='at' size={20} color={colors.tint} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton}>
          <Icon name='hashtag' size={20} color={colors.tint} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ComposeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  headerButton: {
    padding: 4
  },
  cancelText: {
    fontSize: 16
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600'
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16
  },
  postButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600'
  },
  composeArea: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    gap: 12
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  input: {
    flex: 1,
    fontSize: 17,
    lineHeight: 24
  },
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 24
  },
  toolbarButton: {
    padding: 8
  }
});
