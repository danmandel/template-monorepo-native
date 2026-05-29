import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { useSelectedDate } from '@/contexts';
import type { ScheduleFrequency } from '@/lib/schedules';
import type { Tag, Todo, TodoPriority } from '@/lib/todos';
import { loadTags, loadTodos, saveTags, saveTodos } from '@/lib/todos';

type AddTodoModalContextType = {
  isVisible: boolean;
  show: () => void;
  edit: (todo: Todo) => void;
  hide: () => void;
  // Form state
  title: string;
  setTitle: (title: string) => void;
  priority: TodoPriority;
  setPriority: (priority: TodoPriority) => void;
  dueDate: Date | null;
  setDueDate: (date: Date | null) => void;
  scheduledTime: { hours: number; minutes: number } | null;
  setScheduledTime: (time: { hours: number; minutes: number } | null) => void;
  frequency: ScheduleFrequency | null;
  setFrequency: (frequency: ScheduleFrequency | null) => void;
  completedAt: number | null;
  setCompletedAt: (time: number | null) => void;
  // Tags
  selectedTagIds: string[];
  setSelectedTagIds: (ids: string[]) => void;
  availableTags: Tag[];
  createTag: (name: string) => Promise<Tag>;
  // Actions
  submit: () => Promise<void>;
  deleteTodo: () => Promise<void>;
  isSubmitting: boolean;
  // Edit mode
  editingTodo: Todo | null;
};

const AddTodoModalContext = createContext<AddTodoModalContextType | null>(null);

const createId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

const TAG_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Purple
  '#85C1E9' // Light Blue
];

const endOfDay = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).getTime();
};

export const AddTodoModalProvider = ({ children }: { children: ReactNode }) => {
  const { selectedDate } = useSelectedDate();
  const [isVisible, setIsVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState<{ hours: number; minutes: number } | null>(
    null
  );
  const [frequency, setFrequency] = useState<ScheduleFrequency | null>(null);
  const [completedAt, setCompletedAt] = useState<number | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load available tags on mount
  useEffect(() => {
    loadTags().then(setAvailableTags);
  }, []);

  const createTag = useCallback(
    async (name: string): Promise<Tag> => {
      const colorIndex = availableTags.length % TAG_COLORS.length;
      const newTag: Tag = {
        id: createId(),
        name: name.trim(),
        color: TAG_COLORS[colorIndex]
      };
      const updatedTags = [...availableTags, newTag];
      await saveTags(updatedTags);
      setAvailableTags(updatedTags);
      return newTag;
    },
    [availableTags]
  );

  const resetForm = useCallback(() => {
    setTitle('');
    setPriority('medium');
    setDueDate(new Date(selectedDate));
    setScheduledTime(null);
    setFrequency(null);
    setCompletedAt(null);
    setSelectedTagIds([]);
    setEditingTodo(null);
  }, [selectedDate]);

  const show = useCallback(() => {
    resetForm();
    setIsVisible(true);
  }, [resetForm]);

  const edit = useCallback((todo: Todo) => {
    setEditingTodo(todo);
    setTitle(todo.title);
    setPriority(todo.priority);
    setFrequency(todo.frequency ?? todo.scheduleSource?.scheduleFrequency ?? null);
    setCompletedAt(todo.completedAt ?? null);
    setSelectedTagIds(todo.tags ?? []);

    if (todo.scheduledAt) {
      const date = new Date(todo.scheduledAt);
      setDueDate(date);
      setScheduledTime({ hours: date.getHours(), minutes: date.getMinutes() });
    } else if (todo.dueAt) {
      setDueDate(new Date(todo.dueAt));
      setScheduledTime(null);
    } else {
      setDueDate(null);
      setScheduledTime(null);
    }

    setIsVisible(true);
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
    resetForm();
  }, [resetForm]);

  const submit = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setIsSubmitting(true);
    try {
      const now = Date.now();
      const dueAt = dueDate ? endOfDay(dueDate) : undefined;

      // Calculate scheduledAt timestamp if time is set
      let scheduledAt: number | undefined;
      if (scheduledTime && dueDate) {
        const scheduledDate = new Date(dueDate);
        scheduledDate.setHours(scheduledTime.hours, scheduledTime.minutes, 0, 0);
        scheduledAt = scheduledDate.getTime();
      }

      const existing = (await loadTodos()) ?? [];

      if (editingTodo) {
        // Update existing todo
        const updated = existing.map((t) =>
          t.id === editingTodo.id
            ? {
                ...t,
                title: trimmedTitle,
                priority,
                frequency: frequency ?? undefined,
                tags: selectedTagIds.length > 0 ? selectedTagIds : undefined,
                dueAt,
                scheduledAt,
                completedAt: completedAt ?? undefined,
                updatedAt: now
              }
            : t
        );
        await saveTodos(updated);
      } else {
        // Create new todo
        const newTodo: Todo = {
          id: createId(),
          title: trimmedTitle,
          priority,
          frequency: frequency ?? undefined,
          tags: selectedTagIds.length > 0 ? selectedTagIds : undefined,
          createdAt: now,
          updatedAt: now,
          dueAt,
          scheduledAt
        };
        await saveTodos([newTodo, ...existing]);
      }
      hide();
    } finally {
      setIsSubmitting(false);
    }
  }, [
    title,
    priority,
    dueDate,
    scheduledTime,
    frequency,
    completedAt,
    selectedTagIds,
    hide,
    editingTodo
  ]);

  const deleteTodo = useCallback(async () => {
    if (!editingTodo) return;

    setIsSubmitting(true);
    try {
      const existing = (await loadTodos()) ?? [];
      const updated = existing.filter((t) => t.id !== editingTodo.id);
      await saveTodos(updated);
      hide();
    } finally {
      setIsSubmitting(false);
    }
  }, [editingTodo, hide]);

  return (
    <AddTodoModalContext.Provider
      value={{
        isVisible,
        show,
        edit,
        hide,
        title,
        setTitle,
        priority,
        setPriority,
        dueDate,
        setDueDate,
        scheduledTime,
        setScheduledTime,
        frequency,
        setFrequency,
        completedAt,
        setCompletedAt,
        selectedTagIds,
        setSelectedTagIds,
        availableTags,
        createTag,
        submit,
        deleteTodo,
        isSubmitting,
        editingTodo
      }}
    >
      {children}
    </AddTodoModalContext.Provider>
  );
};

export const useAddTodoModal = () => {
  const context = useContext(AddTodoModalContext);
  if (!context) throw new Error('useAddTodoModal must be used within AddTodoModalProvider');
  return context;
};
