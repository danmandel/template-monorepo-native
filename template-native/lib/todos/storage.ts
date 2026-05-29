import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { Tag, Todo } from './types';

const TODOS_STORAGE_KEY = 'todos_v1';
const TAGS_STORAGE_KEY = 'tags_v1';

const safeJsonParse = <T>(raw: string): T | null => {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const loadTodos = async (): Promise<Todo[] | null> => {
  try {
    if (Platform.OS === 'web') {
      const raw = globalThis.localStorage?.getItem(TODOS_STORAGE_KEY);
      if (!raw) return null;
      const parsed = safeJsonParse<Todo[]>(raw);
      return parsed ?? null;
    }

    const raw = await SecureStore.getItemAsync(TODOS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = safeJsonParse<Todo[]>(raw);
    return parsed ?? null;
  } catch {
    return null;
  }
};

export const saveTodos = async (todos: Todo[]): Promise<void> => {
  const raw = JSON.stringify(todos);

  try {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(TODOS_STORAGE_KEY, raw);
      return;
    }

    await SecureStore.setItemAsync(TODOS_STORAGE_KEY, raw);
  } catch {
    // Best-effort persistence.
  }
};

export const loadTags = async (): Promise<Tag[]> => {
  try {
    if (Platform.OS === 'web') {
      const raw = globalThis.localStorage?.getItem(TAGS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = safeJsonParse<Tag[]>(raw);
      return parsed ?? [];
    }

    const raw = await SecureStore.getItemAsync(TAGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = safeJsonParse<Tag[]>(raw);
    return parsed ?? [];
  } catch {
    return [];
  }
};

export const saveTags = async (tags: Tag[]): Promise<void> => {
  const raw = JSON.stringify(tags);

  try {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(TAGS_STORAGE_KEY, raw);
      return;
    }

    await SecureStore.setItemAsync(TAGS_STORAGE_KEY, raw);
  } catch {
    // Best-effort persistence.
  }
};
