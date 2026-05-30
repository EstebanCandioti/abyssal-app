import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { DecorativeBubbles } from '../components/DecorativeBubbles';
import { FrequencyPicker } from '../components/FrequencyPicker';
import { TimePicker } from '../components/TimePicker';
import { api, type FrequencyType, type Reminder, type WeekDay } from '../services/api';

interface Props {
  reminderId: number;
  onBack: () => void;
  onDeleted: () => void;
}

export function ReminderDetailScreen({ reminderId, onBack, onDeleted }: Props) {
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('09:00');
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('weekly');
  const [frequencyDays, setFrequencyDays] = useState<WeekDay[]>([]);
  const [frequencyInterval, setFrequencyInterval] = useState('1');
  const [frequencyStartDate, setFrequencyStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReminder = async () => {
      setLoading(true);
      setError(null);
      try {
        const loaded = await api.getReminder(reminderId);
        setReminder(loaded);
        setTitle(loaded.title);
        setDescription(loaded.description ?? '');
        setTime(loaded.time);
        setFrequencyType(loaded.frequencyType);
        setFrequencyDays(loaded.frequencyDays ?? []);
        setFrequencyInterval(String(loaded.frequencyInterval ?? 1));
        setFrequencyStartDate(loaded.frequencyStartDate ?? new Date().toISOString().slice(0, 10));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el recordatorio.');
      } finally {
        setLoading(false);
      }
    };

    void loadReminder();
  }, [reminderId]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Titulo requerido', 'Escribi un titulo para el recordatorio.');
      return;
    }

    setSaving(true);
    try {
      await api.updateReminder(reminderId, {
        title: title.trim(),
        description: description.trim() || undefined,
        time,
        frequencyType,
        frequencyDays: frequencyType === 'weekly' || frequencyType === 'weekly_interval' ? frequencyDays : undefined,
        frequencyInterval: frequencyType === 'interval' || frequencyType === 'weekly_interval' ? Number(frequencyInterval) : undefined,
        frequencyStartDate: frequencyType === 'interval' || frequencyType === 'weekly_interval' ? frequencyStartDate : undefined
      });
      onBack();
    } catch (saveError) {
      Alert.alert('No se pudo guardar', saveError instanceof Error ? saveError.message : 'Intentalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      const updated = await api.toggleReminder(reminderId);
      setReminder(updated);
    } catch (toggleError) {
      Alert.alert('No se pudo actualizar', toggleError instanceof Error ? toggleError.message : 'Intentalo nuevamente.');
    }
  };

  const handleDelete = () => {
    Alert.alert('Eliminar recordatorio', 'Esta accion no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          void api.deleteReminder(reminderId)
            .then(onDeleted)
            .catch((deleteError) => {
              Alert.alert('No se pudo eliminar', deleteError instanceof Error ? deleteError.message : 'Intentalo nuevamente.');
            });
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.text.accent} />
      </View>
    );
  }

  if (error || !reminder) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>No se pudo abrir</Text>
        <Text style={styles.errorText}>{error ?? 'Recordatorio no encontrado.'}</Text>
        <Pressable style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={colors.text.accent} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>{reminder.active ? 'Activo' : 'Pausado'}</Text>
          <Text style={styles.title}>Editar recordatorio</Text>
        </View>
      </View>
      <DecorativeBubbles />

      <View style={styles.statusCard}>
        <View style={styles.statusText}>
          <Text style={styles.statusTitle}>Recordatorio activo</Text>
          <Text style={styles.statusDescription}>
            {reminder.active ? 'Se incluye en la agenda y puede enviar emails.' : 'Queda pausado hasta que lo reactives.'}
          </Text>
        </View>
        <Switch
          value={reminder.active}
          onValueChange={handleToggleActive}
          disabled={saving}
          trackColor={{ false: colors.background.border, true: '#1a4a60' }}
          thumbColor={reminder.active ? colors.text.accent : colors.text.secondary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Titulo</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Titulo"
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

      <Pressable style={[styles.primaryButton, saving && styles.disabledButton]} onPress={handleSave} disabled={saving}>
        <Text style={styles.primaryButtonText}>{saving ? 'Guardando...' : 'Guardar cambios'}</Text>
      </Pressable>

      <Pressable style={styles.dangerButton} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={18} color={colors.text.primary} />
        <Text style={styles.dangerButtonText}>Eliminar</Text>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 20,
    backgroundColor: colors.background.primary
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.background.border
  },
  headerText: {
    flex: 1
  },
  kicker: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '700'
  },
  title: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: '800'
  },
  statusCard: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.background.border,
    backgroundColor: colors.background.card
  },
  statusText: {
    flex: 1,
    gap: 4
  },
  statusTitle: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '800'
  },
  statusDescription: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18
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
  primaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.text.accent
  },
  primaryButtonText: {
    color: colors.background.primary,
    fontSize: 16,
    fontWeight: '800'
  },
  disabledButton: {
    opacity: 0.7
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.background.border
  },
  secondaryButtonText: {
    color: colors.text.accent,
    fontWeight: '800'
  },
  dangerButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
    backgroundColor: '#7f1d1d'
  },
  dangerButtonText: {
    color: colors.text.primary,
    fontWeight: '800'
  },
  errorTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '800'
  },
  errorText: {
    color: colors.text.secondary,
    textAlign: 'center'
  }
});
