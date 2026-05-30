import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { DecorativeBubbles } from '../components/DecorativeBubbles';
import { FrequencyPicker } from '../components/FrequencyPicker';
import { TimePicker } from '../components/TimePicker';
import { api, type FrequencyType, type WeekDay } from '../services/api';

interface Props {
  onCancel: () => void;
  onCreated: () => void;
}

const dayMap: WeekDay[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function CreateReminderScreen({ onCancel, onCreated }: Props) {
  const today = new Date();
  const todayDate = today.toISOString().slice(0, 10);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('09:00');
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('weekly');
  const [frequencyDays, setFrequencyDays] = useState<WeekDay[]>([dayMap[today.getDay()] ?? 'mon']);
  const [frequencyInterval, setFrequencyInterval] = useState('1');
  const [frequencyStartDate, setFrequencyStartDate] = useState(todayDate);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Titulo requerido', 'Escribi un titulo para el recordatorio.');
      return;
    }

    setSaving(true);
    try {
      await api.createReminder({
        title: title.trim(),
        description: description.trim() || undefined,
        time,
        frequencyType,
        frequencyDays: frequencyType === 'weekly' || frequencyType === 'weekly_interval' ? frequencyDays : undefined,
        frequencyInterval: frequencyType === 'interval' || frequencyType === 'weekly_interval' ? Number(frequencyInterval) : undefined,
        frequencyStartDate: frequencyType === 'interval' || frequencyType === 'weekly_interval' ? frequencyStartDate : undefined
      });
      onCreated();
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Intentalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onCancel}>
          <Ionicons name="chevron-back" size={24} color={colors.text.accent} />
        </Pressable>
        <Text style={styles.title}>Nuevo recordatorio</Text>
      </View>
      <DecorativeBubbles />

      <View style={styles.field}>
        <Text style={styles.label}>Titulo</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Ej: Tomar medicacion"
          placeholderTextColor={colors.text.secondary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Descripcion</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Detalle opcional"
          placeholderTextColor={colors.text.secondary}
          multiline
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Hora</Text>
        <TimePicker value={time} onChange={setTime} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Frecuencia</Text>
        <FrequencyPicker
          frequencyType={frequencyType}
          frequencyDays={frequencyDays}
          frequencyInterval={frequencyInterval}
          frequencyStartDate={frequencyStartDate}
          onFrequencyTypeChange={setFrequencyType}
          onFrequencyDaysChange={setFrequencyDays}
          onFrequencyIntervalChange={setFrequencyInterval}
          onFrequencyStartDateChange={setFrequencyStartDate}
        />
      </View>

      <Pressable style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Guardando...' : 'Guardar'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary
  },
  content: {
    padding: 20,
    gap: 18
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.background.border
  },
  title: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 26,
    fontWeight: '800'
  },
  field: {
    gap: 8
  },
  label: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '700'
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.background.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    color: colors.text.primary,
    backgroundColor: colors.background.card
  },
  textArea: {
    minHeight: 92,
    paddingTop: 12,
    textAlignVertical: 'top'
  },
  saveButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.text.accent
  },
  saveButtonDisabled: {
    opacity: 0.7
  },
  saveButtonText: {
    color: colors.background.primary,
    fontSize: 16,
    fontWeight: '800'
  }
});
