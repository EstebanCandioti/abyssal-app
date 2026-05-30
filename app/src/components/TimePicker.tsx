import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const minutes = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'));

function splitTime(value: string) {
  const [hour = '09', minute = '00'] = value.split(':');
  return {
    hour: hours.includes(hour) ? hour : '09',
    minute: minutes.includes(minute) ? minute : '00'
  };
}

export function TimePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const { width, height } = useWindowDimensions();
  const selected = useMemo(() => splitTime(value), [value]);
  const panelWidth = Math.min(width - 32, 360);
  const columnsHeight = Math.min(Math.max(height * 0.34, 220), 320);
  const optionHeight = Math.min(Math.max(height * 0.052, 38), 46);

  const updateTime = (hour: string, minute: string) => {
    onChange(`${hour}:${minute}`);
  };

  return (
    <>
      <Pressable style={styles.wrapper} onPress={() => setOpen(true)}>
        <Ionicons name="time-outline" size={20} color={colors.text.accent} />
        <Text style={styles.value}>{value}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.text.secondary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={[styles.panel, { width: panelWidth, maxHeight: height * 0.78 }]}>
            <View style={styles.header}>
              <Text style={styles.title}>Elegir horario</Text>
              <Pressable style={styles.closeButton} onPress={() => setOpen(false)}>
                <Ionicons name="close" size={22} color={colors.text.accent} />
              </Pressable>
            </View>

            <View style={[styles.columns, { height: columnsHeight }]}>
              <ScrollView style={styles.column} contentContainerStyle={styles.columnContent}>
                {hours.map((hour) => {
                  const active = hour === selected.hour;
                  return (
                    <Pressable
                      key={hour}
                      style={[styles.option, { minHeight: optionHeight }, active && styles.optionActive]}
                      onPress={() => updateTime(hour, selected.minute)}
                    >
                      <Text style={[styles.optionText, active && styles.optionTextActive]} numberOfLines={1} adjustsFontSizeToFit>
                        {hour}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={styles.separator}>:</Text>

              <ScrollView style={styles.column} contentContainerStyle={styles.columnContent}>
                {minutes.map((minute) => {
                  const active = minute === selected.minute;
                  return (
                    <Pressable
                      key={minute}
                      style={[styles.option, { minHeight: optionHeight }, active && styles.optionActive]}
                      onPress={() => updateTime(selected.hour, minute)}
                    >
                      <Text style={[styles.optionText, active && styles.optionTextActive]} numberOfLines={1} adjustsFontSizeToFit>
                        {minute}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <Pressable style={styles.confirmButton} onPress={() => setOpen(false)}>
              <Text style={styles.confirmText} numberOfLines={1} adjustsFontSizeToFit>Listo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.background.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.background.card
  },
  value: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '800'
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: 'rgba(2, 10, 16, 0.76)'
  },
  panel: {
    maxWidth: 360,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.background.border,
    padding: 16,
    backgroundColor: colors.background.card
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  title: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '800'
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.background.border
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  column: {
    flex: 1
  },
  columnContent: {
    gap: 8,
    paddingVertical: 4
  },
  separator: {
    color: colors.text.accent,
    fontSize: 26,
    fontWeight: '800'
  },
  option: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.background.border
  },
  optionActive: {
    backgroundColor: colors.text.accent
  },
  optionText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '800'
  },
  optionTextActive: {
    color: colors.background.primary
  },
  confirmButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: colors.text.accent
  },
  confirmText: {
    color: colors.background.primary,
    fontSize: 16,
    fontWeight: '800'
  }
});
