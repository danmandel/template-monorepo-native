import { Icon } from '@/components/ui/Icon';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useChatOverlay, type Message } from '@/contexts';
import { useThemedColors } from '@/lib/utils';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type SuggestedPrompt = {
  icon: string;
  title: string;
  prompt: string;
};

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    icon: '\u{1F4CB}',
    title: 'Organize todos',
    prompt: 'Help me prioritize my tasks for today'
  },
  {
    icon: '\u{1F4C5}',
    title: 'Plan my day',
    prompt: 'Help me set up an effective daily schedule'
  },
  {
    icon: '\u{1F3AF}',
    title: 'Build habits',
    prompt: 'How can I build consistent daily habits?'
  },
  {
    icon: '\u{2728}',
    title: 'Stay focused',
    prompt: 'Tips for staying focused and avoiding distractions'
  }
];

export const ChatOverlay = () => {
  const { isVisible, hide, messages, isTyping, sendMessage, clearChat } = useChatOverlay();
  const colors = useThemedColors();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const [inputText, setInputText] = React.useState('');

  // Animation values
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [isVisible, slideAnim, fadeAnim]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleSuggestedPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  if (!isVisible) return null;

  const renderMessage = ({ item: message }: { item: Message }) => {
    const isUser = message.role === 'user';

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer
        ]}
      >
        {!isUser && (
          <View style={[styles.avatarContainer, { backgroundColor: colors.tint }]}>
            <Icon name='magic' size={14} color='#fff' />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser
              ? [styles.userBubble, { backgroundColor: colors.tint }]
              : [
                  styles.assistantBubble,
                  { backgroundColor: colors.card, borderColor: colors.border }
                ]
          ]}
        >
          <Text style={[styles.messageText, { color: isUser ? '#fff' : colors.text }]}>
            {message.content}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View
        style={[styles.logoContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Icon name='magic' size={28} color={colors.tint} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>DailyDash AI</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Your productivity assistant
      </Text>

      <View style={styles.suggestionsContainer}>
        {SUGGESTED_PROMPTS.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.suggestionCard,
              { backgroundColor: colors.card, borderColor: colors.border }
            ]}
            onPress={() => handleSuggestedPrompt(suggestion.prompt)}
          >
            <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
            <Text style={[styles.suggestionTitle, { color: colors.text }]}>{suggestion.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTypingIndicator = () => (
    <View style={[styles.messageContainer, styles.assistantMessageContainer]}>
      <View style={[styles.avatarContainer, { backgroundColor: colors.tint }]}>
        <Icon name='magic' size={14} color='#fff' />
      </View>
      <View
        style={[styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.typingDots}>
          <View style={[styles.typingDot, { backgroundColor: colors.textMuted }]} />
          <View
            style={[
              styles.typingDot,
              styles.typingDotMiddle,
              { backgroundColor: colors.textMuted }
            ]}
          />
          <View style={[styles.typingDot, { backgroundColor: colors.textMuted }]} />
        </View>
      </View>
    </View>
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents='box-none'>
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: fadeAnim }]}
        pointerEvents={isVisible ? 'auto' : 'none'}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={hide} activeOpacity={1} />
      </Animated.View>

      {/* Chat Panel */}
      <Animated.View
        style={[
          styles.panel,
          {
            backgroundColor: colors.background,
            transform: [{ translateY: slideAnim }],
            paddingTop: insets.top
          }
        ]}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity style={styles.headerButton} onPress={hide}>
              <Icon name='chevron-down' size={18} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Icon name='magic' size={16} color={colors.tint} style={styles.headerIcon} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>DailyDash AI</Text>
            </View>
            {messages.length > 0 ? (
              <TouchableOpacity style={styles.headerButton} onPress={clearChat}>
                <Icon name='plus' size={18} color={colors.tint} />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerButton} />
            )}
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.messagesList,
              messages.length === 0 && styles.emptyList,
              { paddingBottom: insets.bottom + 80 }
            ]}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={isTyping ? renderTypingIndicator : null}
            showsVerticalScrollIndicator={false}
          />

          {/* Input */}
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors.backgroundSecondary,
                borderTopColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 12)
              }
            ]}
          >
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.card, borderColor: colors.border }
              ]}
            >
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: colors.text }]}
                placeholder='Ask about productivity, schedules, habits...'
                placeholderTextColor={colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={2000}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: inputText.trim() ? colors.tint : colors.border }
                ]}
                onPress={handleSend}
                disabled={!inputText.trim() || isTyping}
              >
                <Icon
                  name='arrow-up'
                  size={16}
                  color={inputText.trim() ? '#fff' : colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0
  },
  keyboardView: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerIcon: {
    marginRight: 8
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600'
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center'
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 20
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 15,
    marginBottom: 28
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    width: '100%'
  },
  suggestionCard: {
    width: '47%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center'
  },
  suggestionIcon: {
    fontSize: 24,
    marginBottom: 8
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center'
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 14,
    maxWidth: '100%'
  },
  userMessageContainer: {
    justifyContent: 'flex-end'
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start'
  },
  avatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16
  },
  userBubble: {
    borderBottomRightRadius: 4
  },
  assistantBubble: {
    borderWidth: 1,
    borderBottomLeftRadius: 4
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21
  },
  typingBubble: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderBottomLeftRadius: 4
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    opacity: 0.4
  },
  typingDotMiddle: {
    opacity: 0.7
  },
  inputContainer: {
    padding: 12,
    borderTopWidth: 1
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderRadius: 22,
    paddingLeft: 14,
    paddingRight: 5,
    paddingVertical: 5
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 7
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
