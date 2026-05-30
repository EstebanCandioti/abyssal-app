import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/theme';
import { AbyssalBackground } from '../components/AbyssalBackground';
import { BottomNav, type MainTab } from '../components/BottomNav';
import { ReminderCard } from '../components/ReminderCard';
import { api, type Quote, type Reminder } from '../services/api';

interface Props {
  onCreatePress: () => void;
  onReminderPress: (id: number) => void;
  onTabPress: (tab: MainTab) => void;
}

export function HomeScreen({ onCreatePress, onReminderPress, onTabPress }: Props) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [togglingIds, setTogglingIds] = useState<number[]>([]);

  const loadReminders = useCallback(async () => {
    setLoading(true);
    setError(null);
    setActionError(null);
    try {
      const [todayReminders, dailyQuote] = await Promise.all([
        api.getTodayReminders(),
        api.getDailyQuote()
      ]);
      setReminders(todayReminders);
      setQuote(dailyQuote);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los recordatorios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReminders();
  }, [loadReminders]);

  const handleToggleComplete = async (id: number) => {
    setActionError(null);
    const currentReminder = reminders.find((item) => item.id === id);

    if (!currentReminder || togglingIds.includes(id)) {
      return;
    }

    const previousCompleted = Boolean(currentReminder.completedToday);
    setTogglingIds((current) => [...current, id]);
    setReminders((current) => current.map((item) => (
      item.id === id ? { ...item, completedToday: !previousCompleted } : item
    )));

    try {
      const updated = await api.toggleReminderComplete(id);
      setReminders((current) => current.map((item) => (
        item.id === id ? { ...item, completedToday: updated.completedToday } : item
      )));
    } catch (toggleError) {
      setReminders((current) => current.map((item) => (
        item.id === id ? { ...item, completedToday: previousCompleted } : item
      )));
      setActionError(toggleError instanceof Error ? toggleError.message : 'No se pudo actualizar el recordatorio.');
    } finally {
      setTogglingIds((current) => current.filter((item) => item !== id));
    }
  };

  const completedCount = reminders.filter((reminder) => reminder.completedToday).length;
  const pendingCount = reminders.length - completedCount;
  const todayLabel = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());

  return (
    <LinearGradient colors={['#0d2a4a', '#071828', '#020a10']} locations={[0, 0.48, 1]} style={styles.screen}>
      <AbyssalBackground />

      <View style={styles.header}>
        <View>
          <Text style={styles.date}>{todayLabel}</Text>
          <Text style={styles.dailyQuote} numberOfLines={4}>
            {quote?.text ?? ' '}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.text.accent} />
        </View>
      ) : error && reminders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Sin conexion</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <Pressable style={styles.textButton} onPress={loadReminders}>
            <Text style={styles.textButtonLabel}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hoy · {reminders.length}</Text>
          </View>
          {reminders.length > 0 ? (
            <View style={styles.summary}>
              <View style={styles.summaryItem}>
                <Ionicons name="ellipse-outline" size={17} color={colors.text.accent} />
                <Text style={styles.summaryText}>{pendingCount} pendientes</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="checkmark-circle" size={17} color={colors.text.accent} />
                <Text style={styles.summaryText}>{completedCount} hechos</Text>
              </View>
            </View>
          ) : null}
          {actionError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{actionError}</Text>
            </View>
          ) : null}
          <FlatList
            data={reminders}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={reminders.length === 0 ? styles.emptyList : styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ReminderCard
                reminder={item}
                onToggle={handleToggleComplete}
                onPress={(reminder) => onReminderPress(reminder.id)}
                toggleDisabled={togglingIds.includes(item.id)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.whale}>~</Text>
                <Text style={styles.emptyTitle}>No hay recordatorios para hoy</Text>
                <Text style={styles.emptyText}>La superficie esta tranquila.</Text>
              </View>
            }
          />
        </>
      )}

      <BottomNav activeTab="home" onTabPress={onTabPress} />

      <Pressable style={styles.floatingButton} onPress={onCreatePress}>
        <Ionicons name="add" size={32} color={colors.text.accent} />
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 92,
    gap: 18
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 138
  },
  date: {
    marginTop: 4,
    color: colors.text.accent,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize'
  },
  dailyQuote: {
    marginTop: 14,
    maxWidth: 300,
    minHeight: 70,
    color: colors.text.accent,
    fontFamily: 'serif',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17
  },
  list: {
    gap: 12,
    paddingBottom: 26
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between'
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: '800'
  },
  summary: {
    flexDirection: 'row',
    gap: 10
  },
  summaryItem: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.background.border,
    backgroundColor: colors.background.card
  },
  summaryText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '700'
  },
  emptyList: {
    flexGrow: 1
  },
  center: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20
  },
  whale: {
    color: colors.text.accent,
    fontSize: 42,
    fontFamily: 'serif'
  },
  emptyTitle: {
    width: '100%',
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    flexWrap: 'wrap'
  },
  emptyText: {
    width: '100%',
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    flexWrap: 'wrap'
  },
  textButton: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.background.border
  },
  textButtonLabel: {
    color: colors.text.accent,
    fontWeight: '700'
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.background.border,
    backgroundColor: colors.background.card
  },
  errorBannerText: {
    color: colors.text.accent,
    fontSize: 13,
    textAlign: 'center'
  },
  floatingButton: {
    position: 'absolute',
    right: 22,
    bottom: 96,
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.text.accent,
    backgroundColor: colors.background.card
  },
});
