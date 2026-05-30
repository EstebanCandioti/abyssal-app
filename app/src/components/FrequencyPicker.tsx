import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../constants/theme';
import type { FrequencyType, WeekDay } from '../services/api';

const weekDays: Array<{ label: string; value: WeekDay }> = [
  { label: 'Lun', value: 'mon' },
  { label: 'Mar', value: 'tue' },
  { label: 'Mie', value: 'wed' },
  { label: 'Jue', value: 'thu' },
  { label: 'Vie', value: 'fri' },
  { label: 'Sab', value: 'sat' },
  { label: 'Dom', value: 'sun' }
];

interface Props {
  frequencyType: FrequencyType;
  frequencyDays: WeekDay[];
  frequencyInterval: string;
  frequencyStartDate: string;
  onFrequencyTypeChange: (value: FrequencyType) => void;
  onFrequencyDaysChange: (value: WeekDay[]) => void;
  onFrequencyIntervalChange: (value: string) => void;
  onFrequencyStartDateChange: (value: string) => void;
}

export function FrequencyPicker({
  frequencyType,
  frequencyDays,
  frequencyInterval,
  frequencyStartDate,
  onFrequencyTypeChange,
  onFrequencyDaysChange,
  onFrequencyIntervalChange,
  onFrequencyStartDateChange
}: Props) {
  const normalizedInterval = Number(frequencyInterval) > 0 ? Number(frequencyInterval) : 1;
  const intervalUnit = normalizedInterval === 1 ? 'dia' : 'dias';

  const toggleDay = (day: WeekDay) => {
    if (frequencyType === 'weekly_interval') {
      onFrequencyDaysChange([day]);
      return;
    }

    if (frequencyDays.includes(day)) {
      onFrequencyDaysChange(frequencyDays.filter((item) => item !== day));
      return;
    }
    onFrequencyDaysChange([...frequencyDays, day]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.segment}>
        <Pressable
          style={[styles.segmentButton, frequencyType === 'weekly' && styles.segmentButtonActive]}
          onPress={() => onFrequencyTypeChange('weekly')}
        >
          <Text style={[styles.segmentText, frequencyType === 'weekly' && styles.segmentTextActive]}>Dias semana</Text>
        </Pressable>
        <Pressable
          style={[styles.segmentButton, frequencyType === 'weekly_interval' && styles.segmentButtonActive]}
          onPress={() => {
            onFrequencyTypeChange('weekly_interval');
            onFrequencyDaysChange([frequencyDays[0] ?? 'mon']);
          }}
        >
          <Text style={[styles.segmentText, frequencyType === 'weekly_interval' && styles.segmentTextActive]}>Semanas</Text>
        </Pressable>
        <Pressable
          style={[styles.segmentButton, frequencyType === 'interval' && styles.segmentButtonActive]}
          onPress={() => onFrequencyTypeChange('interval')}
        >
          <Text style={[styles.segmentText, frequencyType === 'interval' && styles.segmentTextActive]}>Intervalo</Text>
        </Pressable>
      </View>

      {frequencyType === 'weekly' ? (
        <View style={styles.days}>
          {weekDays.map((day) => {
            const active = frequencyDays.includes(day.value);
            return (
              <Pressable key={day.value} style={[styles.dayButton, active && styles.dayButtonActive]} onPress={() => toggleDay(day.value)}>
                <Text style={[styles.dayText, active && styles.dayTextActive]}>{day.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : frequencyType === 'weekly_interval' ? (
        <View style={styles.intervalPanel}>
          <Text style={styles.helpText}>
            Repite en un dia fijo, saltando la cantidad de semanas que elijas.
          </Text>

          <View style={styles.intervalField}>
            <Text style={styles.inputLabel}>Repetir cada</Text>
            <View style={styles.inputWithSuffix}>
              <TextInput
                style={styles.numberInput}
                value={frequencyInterval}
                onChangeText={onFrequencyIntervalChange}
                keyboardType="number-pad"
                placeholder="1"
                placeholderTextColor={colors.text.secondary}
              />
              <Text style={styles.suffix}>{normalizedInterval === 1 ? 'semana' : 'semanas'}</Text>
            </View>
          </View>

          <View style={styles.intervalField}>
            <Text style={styles.inputLabel}>Dia de la semana</Text>
            <View style={styles.days}>
              {weekDays.map((day) => {
                const active = frequencyDays.includes(day.value);
                return (
                  <Pressable key={day.value} style={[styles.dayButton, active && styles.dayButtonActive]} onPress={() => toggleDay(day.value)}>
                    <Text style={[styles.dayText, active && styles.dayTextActive]}>{day.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.intervalField}>
            <Text style={styles.inputLabel}>Semana inicial</Text>
            <TextInput
              style={styles.input}
              value={frequencyStartDate}
              onChangeText={onFrequencyStartDateChange}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.text.secondary}
            />
          </View>

          <Text style={styles.previewText}>
            Se activara cada {normalizedInterval} {normalizedInterval === 1 ? 'semana' : 'semanas'} los {weekDays.find((day) => day.value === frequencyDays[0])?.label ?? 'dias elegidos'}.
          </Text>
        </View>
      ) : (
        <View style={styles.intervalPanel}>
          <Text style={styles.helpText}>
            Repite el recordatorio cada cierta cantidad de dias, contando desde la fecha inicial.
          </Text>

          <View style={styles.intervalRow}>
            <View style={styles.intervalField}>
              <Text style={styles.inputLabel}>Repetir cada</Text>
              <View style={styles.inputWithSuffix}>
                <TextInput
                  style={styles.numberInput}
                  value={frequencyInterval}
                  onChangeText={onFrequencyIntervalChange}
                  keyboardType="number-pad"
                  placeholder="1"
                  placeholderTextColor={colors.text.secondary}
                />
                <Text style={styles.suffix}>{intervalUnit}</Text>
              </View>
            </View>

            <View style={styles.intervalField}>
              <Text style={styles.inputLabel}>Empezando el</Text>
              <TextInput
                style={styles.input}
                value={frequencyStartDate}
                onChangeText={onFrequencyStartDateChange}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          </View>

          <Text style={styles.previewText}>
            Se activara cada {normalizedInterval} {intervalUnit} desde {frequencyStartDate || 'la fecha inicial'}.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12
  },
  segment: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.background.border,
    borderRadius: 8,
    overflow: 'hidden'
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary
  },
  segmentButtonActive: {
    backgroundColor: colors.background.card
  },
  segmentText: {
    color: colors.text.secondary,
    fontWeight: '700'
  },
  segmentTextActive: {
    color: colors.text.primary
  },
  days: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  dayButton: {
    width: 48,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.background.border
  },
  dayButtonActive: {
    backgroundColor: colors.text.accent
  },
  dayText: {
    color: colors.text.secondary,
    fontWeight: '700'
  },
  dayTextActive: {
    color: colors.background.primary
  },
  intervalPanel: {
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.background.border,
    backgroundColor: colors.background.primary
  },
  helpText: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18
  },
  intervalRow: {
    gap: 10
  },
  intervalField: {
    gap: 6
  },
  inputLabel: {
    color: colors.text.accent,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  inputWithSuffix: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.background.border,
    borderRadius: 8,
    backgroundColor: colors.background.card
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
  numberInput: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 14,
    color: colors.text.primary
  },
  suffix: {
    paddingRight: 14,
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '700'
  },
  previewText: {
    color: colors.text.accent,
    fontSize: 13,
    lineHeight: 18
  }
});
