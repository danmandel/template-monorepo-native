import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
};

type ChatOverlayContextType = {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
  toggle: () => void;
  messages: Message[];
  isTyping: boolean;
  sendMessage: (text: string) => void;
  clearChat: () => void;
};

const MOCK_RESPONSES: Record<string, string> = {
  default: `I'm your AI assistant for DailyDash. I can help you with:

• **Productivity** - Managing your todos and daily schedules
• **Planning** - Organizing your day and week
• **Habits** - Building and tracking routines
• **Goals** - Setting and achieving your objectives

What would you like help with today?`,

  schedule: `## Setting Up Your Daily Schedule

Here are some tips for an effective daily routine:

**Morning Block (6-9 AM):**
• Wake up at a consistent time
• Hydrate first thing
• Light exercise or stretching
• Review today's priorities

**Focus Block (9 AM - 12 PM):**
• Tackle your most important task first
• Minimize distractions (phone on DND)
• Take short breaks every 90 minutes

**Afternoon Block (1-5 PM):**
• Meetings and collaboration
• Lighter cognitive tasks
• Email and communications

**Evening Block (6-9 PM):**
• Disconnect from work
• Personal time and hobbies
• Prepare for tomorrow
• Wind down routine

Would you like me to help you customize this for your needs?`,

  todo: `## Effective Todo Management

**The 1-3-5 Rule:**
Each day, plan to accomplish:
• 1 big task (your main priority)
• 3 medium tasks
• 5 small tasks

**Prioritization Tips:**
1. Start with your MIT (Most Important Task)
2. Use timeblocking for focused work
3. Group similar tasks together
4. Leave buffer time between tasks

**When You're Overwhelmed:**
• Brain dump everything first
• Then categorize by urgency vs importance
• Delete or delegate what you can
• Focus on one thing at a time

Want help organizing your current todos?`,

  habits: `## Building Better Habits

**The Habit Loop:**
1. **Cue** - The trigger that starts the behavior
2. **Routine** - The behavior itself
3. **Reward** - The benefit you get

**Tips for Success:**
• Start incredibly small (2 minutes or less)
• Stack new habits onto existing ones
• Make good habits obvious and easy
• Track your streaks for motivation
• Don't break the chain - consistency beats intensity

**Morning Routine Ideas:**
• Make your bed immediately
• Drink a glass of water
• 5 minutes of movement
• Review your schedule

Would you like help setting up habit tracking in your schedules?`
};

const generateResponse = (userMessage: string): string => {
  const lower = userMessage.toLowerCase();
  if (lower.includes('schedule') || lower.includes('routine') || lower.includes('daily'))
    return MOCK_RESPONSES.schedule;
  if (lower.includes('todo') || lower.includes('task') || lower.includes('priorit'))
    return MOCK_RESPONSES.todo;
  if (lower.includes('habit') || lower.includes('streak') || lower.includes('consistent'))
    return MOCK_RESPONSES.habits;
  return MOCK_RESPONSES.default;
};

const ChatOverlayContext = createContext<ChatOverlayContextType | null>(null);

export const ChatOverlayProvider = ({ children }: { children: ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const show = useCallback(() => setIsVisible(true), []);
  const hide = useCallback(() => setIsVisible(false), []);
  const toggle = useCallback(() => setIsVisible((v) => !v), []);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(
      () => {
        const response = generateResponse(text);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: Date.now()
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsTyping(false);
      },
      1000 + Math.random() * 1000
    );
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <ChatOverlayContext.Provider
      value={{ isVisible, show, hide, toggle, messages, isTyping, sendMessage, clearChat }}
    >
      {children}
    </ChatOverlayContext.Provider>
  );
};

export const useChatOverlay = () => {
  const context = useContext(ChatOverlayContext);
  if (!context) throw new Error('useChatOverlay must be used within ChatOverlayProvider');
  return context;
};
