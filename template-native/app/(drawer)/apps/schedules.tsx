import { Icon } from '@/components/ui/Icon';
import { useLocalSearchParams } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Themed';
import { ScheduleList, TaskList, ScheduleModal, TaskModal } from '@/components/schedules';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import {
  getScheduleEmoji,
  getScheduleTitle,
  getScheduleTodoDefs,
  useSchedules,
  type Schedule,
  type ScheduleMode,
  type ScheduleTask
} from '@/lib/schedules';
import { useThemedColors } from '@/lib/utils';

type ViewMode = 'schedules' | 'tasks';

export const SchedulesScreen = () => {
  const colors = useThemedColors();
  const params = useLocalSearchParams<{ scheduleId?: string | string[] }>();
  const routeScheduleId = Array.isArray(params.scheduleId)
    ? params.scheduleId[0]
    : params.scheduleId;
  const {
    schedules,
    isLoading,
    activeSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    duplicateSchedule,
    setActiveSchedule,
    addTask,
    updateTask,
    deleteTask,
    setTaskStatus,
    getTaskStatus,
    getScheduleProgress
  } = useSchedules();

  const [viewMode, setViewMode] = useState<ViewMode>('schedules');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [handledRouteScheduleId, setHandledRouteScheduleId] = useState<string | null>(null);

  // Modal state
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduleTask | null>(null);

  // Schedule handlers
  const handleSelectSchedule = useCallback(
    (schedule: Schedule) => {
      setSelectedSchedule(schedule);
      setActiveSchedule(schedule.id);
      setViewMode('tasks');
    },
    [setActiveSchedule]
  );

  useEffect(() => {
    if (!routeScheduleId || routeScheduleId === handledRouteScheduleId) return;

    const schedule = schedules.find((s) => s.id === routeScheduleId);
    if (!schedule) return;

    setSelectedSchedule(schedule);
    setActiveSchedule(schedule.id);
    setViewMode('tasks');
    setHandledRouteScheduleId(routeScheduleId);
  }, [handledRouteScheduleId, routeScheduleId, schedules, setActiveSchedule]);

  const handleCreateSchedule = useCallback(() => {
    setEditingSchedule(null);
    setScheduleModalVisible(true);
  }, []);

  const handleEditSchedule = useCallback((schedule: Schedule) => {
    setEditingSchedule(schedule);
    setScheduleModalVisible(true);
  }, []);

  const handleDeleteSchedule = useCallback(
    (schedule: Schedule) => {
      Alert.alert(
        'Delete Schedule',
        `Are you sure you want to delete "${getScheduleTitle(schedule)}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteSchedule(schedule.id);
              if (selectedSchedule?.id === schedule.id) {
                setSelectedSchedule(null);
                setViewMode('schedules');
              }
            }
          }
        ]
      );
    },
    [deleteSchedule, selectedSchedule]
  );

  const handleDuplicateSchedule = useCallback(
    async (schedule: Schedule) => {
      await duplicateSchedule(schedule.id);
    },
    [duplicateSchedule]
  );

  const handleSaveSchedule = useCallback(
    async (data: {
      title: string;
      emoji?: string;
      description?: string;
      mode: ScheduleMode;
      isActive: boolean;
    }) => {
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, data);
      } else {
        await createSchedule({ ...data, todoDefs: [], frequency: 'daily', visibility: 'private' });
      }
      setScheduleModalVisible(false);
      setEditingSchedule(null);
    },
    [editingSchedule, createSchedule, updateSchedule]
  );

  // Task handlers
  const handleCreateTask = useCallback(() => {
    setEditingTask(null);
    setTaskModalVisible(true);
  }, []);

  const handleEditTask = useCallback((task: ScheduleTask) => {
    setEditingTask(task);
    setTaskModalVisible(true);
  }, []);

  const handleDeleteTask = useCallback(
    (task: ScheduleTask) => {
      if (!selectedSchedule) return;
      Alert.alert('Delete Task', `Are you sure you want to delete "${task.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTask(selectedSchedule.id, task.id)
        }
      ]);
    },
    [selectedSchedule, deleteTask]
  );

  const handleToggleTaskStatus = useCallback(
    (taskId: string) => {
      if (!selectedSchedule) return;
      const currentStatus = getTaskStatus(selectedSchedule.id, taskId);
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      setTaskStatus(selectedSchedule.id, taskId, newStatus);
    },
    [selectedSchedule, getTaskStatus, setTaskStatus]
  );

  const handleSaveTask = useCallback(
    async (data: {
      timeOfDay: string;
      title: string;
      duration?: number;
      category?: ScheduleTask['category'];
    }) => {
      if (!selectedSchedule) return;
      if (editingTask) {
        await updateTask(selectedSchedule.id, editingTask.id, data);
      } else {
        await addTask(selectedSchedule.id, data);
      }
      setTaskModalVisible(false);
      setEditingTask(null);
    },
    [selectedSchedule, editingTask, addTask, updateTask]
  );

  const handleBackToSchedules = useCallback(() => {
    setViewMode('schedules');
    setSelectedSchedule(null);
  }, []);

  // Find current selected schedule from state (it may have been updated)
  const currentSchedule = selectedSchedule
    ? (schedules.find((s) => s.id === selectedSchedule.id) ?? selectedSchedule)
    : null;

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title='Schedules' subtitle='Loading...' />
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.textMuted }}>Loading schedules...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {viewMode === 'schedules' ? (
        <>
          <ScreenHeader
            title='Schedules'
            subtitle={`${schedules.length} schedule${schedules.length !== 1 ? 's' : ''}`}
          />
          <ScheduleList
            schedules={schedules}
            selectedId={activeSchedule?.id}
            colors={colors}
            onSelect={handleSelectSchedule}
            onEdit={handleEditSchedule}
            onDelete={handleDeleteSchedule}
            onDuplicate={handleDuplicateSchedule}
            getProgress={getScheduleProgress}
          />
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.tint }]}
            onPress={handleCreateSchedule}
            activeOpacity={0.8}
          >
            <Icon name='plus' size={24} color='#fff' />
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View
            style={[
              styles.taskHeader,
              { backgroundColor: colors.backgroundSecondary, borderBottomColor: colors.border }
            ]}
          >
            <TouchableOpacity style={styles.backButton} onPress={handleBackToSchedules}>
              <Icon name='arrow-left' size={18} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.taskHeaderContent}>
              {currentSchedule && getScheduleEmoji(currentSchedule) && (
                <Text style={styles.scheduleEmoji}>{getScheduleEmoji(currentSchedule)}</Text>
              )}
              <View>
                <Text style={[styles.scheduleTitle, { color: colors.text }]}>
                  {currentSchedule ? getScheduleTitle(currentSchedule) : 'Schedule'}
                </Text>
                <Text style={[styles.taskCount, { color: colors.textMuted }]}>
                  {currentSchedule ? getScheduleTodoDefs(currentSchedule).length : 0} tasks
                </Text>
              </View>
            </View>
          </View>
          {currentSchedule && (
            <TaskList
              tasks={getScheduleTodoDefs(currentSchedule)}
              colors={colors}
              getTaskStatus={(taskId) => getTaskStatus(currentSchedule.id, taskId)}
              onToggleStatus={handleToggleTaskStatus}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          )}
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.tint }]}
            onPress={handleCreateTask}
            activeOpacity={0.8}
          >
            <Icon name='plus' size={24} color='#fff' />
          </TouchableOpacity>
        </>
      )}

      <ScheduleModal
        visible={scheduleModalVisible}
        schedule={editingSchedule}
        onClose={() => {
          setScheduleModalVisible(false);
          setEditingSchedule(null);
        }}
        onSave={handleSaveSchedule}
      />

      <TaskModal
        visible={taskModalVisible}
        task={editingTask}
        onClose={() => {
          setTaskModalVisible(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
      />
    </View>
  );
};

export default SchedulesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center'
  },
  taskHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  scheduleEmoji: {
    fontSize: 28
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: '700'
  },
  taskCount: {
    fontSize: 13,
    fontWeight: '500'
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8
  }
});
