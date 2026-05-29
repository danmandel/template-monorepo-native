import { Icon } from '@/components/ui/Icon';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Themed';
import type { Tag } from '@/lib/todos';
import { useThemedColors } from '@/lib/utils';

type TagSelectorProps = {
  availableTags: Tag[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onCreateTag: (name: string) => Promise<Tag>;
  disabled?: boolean;
};

export const TagSelector = ({
  availableTags,
  selectedTagIds,
  onToggleTag,
  onCreateTag,
  disabled
}: TagSelectorProps) => {
  const colors = useThemedColors();
  const [newTagName, setNewTagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTag = async () => {
    const trimmed = newTagName.trim();
    if (!trimmed || isCreating) return;

    // Check if tag already exists
    const exists = availableTags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      // Select the existing tag instead
      const existingTag = availableTags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
      if (existingTag && !selectedTagIds.includes(existingTag.id)) {
        onToggleTag(existingTag.id);
      }
      setNewTagName('');
      return;
    }

    setIsCreating(true);
    try {
      const newTag = await onCreateTag(trimmed);
      onToggleTag(newTag.id);
      setNewTagName('');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>Tags</Text>

      {/* Tag input for creating new tags */}
      <View style={styles.inputRow}>
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }
          ]}
        >
          <Icon name='tag' size={14} color={colors.textMuted} />
          <TextInput
            value={newTagName}
            onChangeText={setNewTagName}
            placeholder='Add new tag...'
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text }]}
            returnKeyType='done'
            onSubmitEditing={handleCreateTag}
            editable={!disabled && !isCreating}
          />
          {newTagName.trim().length > 0 && (
            <TouchableOpacity
              onPress={handleCreateTag}
              disabled={disabled || isCreating}
              style={[styles.addButton, { backgroundColor: colors.tint }]}
            >
              <Icon name='plus' size={12} color='#000' />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Existing tags */}
      {availableTags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagGrid}
        >
          {availableTags.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.id);
            return (
              <TouchableOpacity
                key={tag.id}
                onPress={() => onToggleTag(tag.id)}
                style={[
                  styles.tagChip,
                  {
                    backgroundColor: isSelected ? tag.color : colors.backgroundSecondary,
                    borderColor: isSelected ? tag.color : 'transparent'
                  }
                ]}
                disabled={disabled}
              >
                <Text
                  style={[
                    styles.tagChipText,
                    { color: isSelected ? '#000' : colors.textSecondary }
                  ]}
                >
                  {tag.name}
                </Text>
                {isSelected && (
                  <Icon name='check' size={10} color='#000' style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10
  },
  inputRow: {
    marginBottom: 10
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 2
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tagGrid: {
    flexDirection: 'row',
    gap: 8
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6
  },
  tagChipText: {
    fontSize: 14,
    fontWeight: '600'
  },
  checkIcon: {
    marginLeft: 2
  }
});
