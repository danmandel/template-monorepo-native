import { useCallback, useEffect, useState } from 'react';

import { useSupabaseContext } from './provider';
import type { Database, TodoPriority } from './types';

type DbTodo = Database['public']['Tables']['todos']['Row'];

export type Todo = {
  id: string;
  title: string;
  notes?: string;
  priority: TodoPriority;
  dueAt?: Date;
  scheduledAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

// Convert database row to app type
const fromDb = (row: DbTodo): Todo => ({
  id: row.id,
  title: row.title,
  notes: row.notes ?? undefined,
  priority: row.priority,
  dueAt: row.due_at ? new Date(row.due_at) : undefined,
  scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
  completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
});

export type CreateTodoInput = {
  title: string;
  notes?: string;
  priority?: TodoPriority;
  dueAt?: Date;
  scheduledAt?: Date;
};

export type UpdateTodoInput = {
  title?: string;
  notes?: string | null;
  priority?: TodoPriority;
  dueAt?: Date | null;
  scheduledAt?: Date | null;
  completedAt?: Date | null;
};

export const useTodos = () => {
  const { supabase, profile, isLoading: contextLoading } = useSupabaseContext();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load todos
  const loadTodos = useCallback(async () => {
    if (!supabase || !profile) {
      setTodos([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .returns<DbTodo[]>();

      if (fetchError) throw fetchError;

      setTodos((data ?? []).map(fromDb));
    } catch (err) {
      console.error('Error loading todos:', err);
      setError(err instanceof Error ? err : new Error('Failed to load todos'));
    } finally {
      setIsLoading(false);
    }
  }, [supabase, profile]);

  // Initial load
  useEffect(() => {
    if (!contextLoading) {
      void loadTodos();
    }
  }, [contextLoading, loadTodos]);

  // Create todo
  const createTodo = useCallback(
    async (input: CreateTodoInput): Promise<Todo | null> => {
      if (!supabase || !profile) return null;

      try {
        const { data, error: insertError } = await supabase
          .from('todos')
          .insert({
            user_id: profile.id,
            title: input.title,
            notes: input.notes ?? null,
            priority: input.priority ?? 'medium',
            due_at: input.dueAt?.toISOString() ?? null,
            scheduled_at: input.scheduledAt?.toISOString() ?? null
          })
          .select()
          .single<DbTodo>();

        if (insertError) throw insertError;

        const todo = fromDb(data!);
        setTodos((prev) => [todo, ...prev]);
        return todo;
      } catch (err) {
        console.error('Error creating todo:', err);
        throw err;
      }
    },
    [supabase, profile]
  );

  // Update todo
  const updateTodo = useCallback(
    async (id: string, input: UpdateTodoInput): Promise<Todo | null> => {
      if (!supabase || !profile) return null;

      try {
        const updateData: Record<string, unknown> = {};
        if (input.title !== undefined) updateData.title = input.title;
        if (input.notes !== undefined) updateData.notes = input.notes;
        if (input.priority !== undefined) updateData.priority = input.priority;
        if (input.dueAt !== undefined) updateData.due_at = input.dueAt?.toISOString() ?? null;
        if (input.scheduledAt !== undefined)
          updateData.scheduled_at = input.scheduledAt?.toISOString() ?? null;
        if (input.completedAt !== undefined)
          updateData.completed_at = input.completedAt?.toISOString() ?? null;

        const { data, error: updateError } = await supabase
          .from('todos')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', profile.id)
          .select()
          .single<DbTodo>();

        if (updateError) throw updateError;

        const todo = fromDb(data!);
        setTodos((prev) => prev.map((t) => (t.id === id ? todo : t)));
        return todo;
      } catch (err) {
        console.error('Error updating todo:', err);
        throw err;
      }
    },
    [supabase, profile]
  );

  // Toggle completion
  const toggleComplete = useCallback(
    async (id: string): Promise<void> => {
      const todo = todos.find((t) => t.id === id);
      if (!todo) return;

      await updateTodo(id, {
        completedAt: todo.completedAt ? null : new Date()
      });
    },
    [todos, updateTodo]
  );

  // Delete todo
  const deleteTodo = useCallback(
    async (id: string): Promise<void> => {
      if (!supabase || !profile) return;

      try {
        const { error: deleteError } = await supabase
          .from('todos')
          .delete()
          .eq('id', id)
          .eq('user_id', profile.id);

        if (deleteError) throw deleteError;

        setTodos((prev) => prev.filter((t) => t.id !== id));
      } catch (err) {
        console.error('Error deleting todo:', err);
        throw err;
      }
    },
    [supabase, profile]
  );

  return {
    todos,
    isLoading: contextLoading || isLoading,
    error,
    createTodo,
    updateTodo,
    toggleComplete,
    deleteTodo,
    reload: loadTodos
  };
};
