import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/theme';
import { AllRemindersBackground } from '../components/AllRemindersBackground';
import { BottomNav, type MainTab } from '../components/BottomNav';
import { ReminderCard } from '../components/ReminderCard';
import { api, type Reminder } from '../services/api';

interface Props {
  onCreatePress: () => void;
  onReminderPress: (id: number) => void;
  onTabPress: (tab: MainTab) => void;
}

export function AllRemindersScreen({ onCreatePress, onReminderPress, onTabPress }: Props) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReminders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReminders(await api.getReminders());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los recordatorios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReminders();
  }, [loadReminders]);

  const filteredReminders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return reminders;
    }

    return reminders.filter((reminder) => (
      reminder.title.toLowerCase().includes(normalizedQuery) ||
      (reminder.description ?? '').toLowerCase().includes(normalizedQuery)
    ));
  }, [query, reminders]);

  return (
    <LinearGradient colors={['#0d2a4a', '#071828', '#020a10']} locations={[0, 0.48, 1]} style={styles.screen}>
      <AllRemindersBackground />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Recordatorios · {filteredReminders.length}</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Image source={require('../assets/sherlock-holmes-svgrepo-com.png')} style={styles.searchIcon} resizeMode="contain" />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar recordatorio"
          placeholderTextColor={colors.text.secondary}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
          </Pressable>
        ) : null}
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
          <FlatList
            data={filteredReminders}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={filteredReminders.length === 0 ? styles.emptyList : styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ReminderCard
                reminder={item}
                onPress={(reminder) => onReminderPress(reminder.id)}
                showChecker={false}
              />
            )}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyTitle}>Sin resultados</Text>
                <Text style={styles.emptyText}>No hay pistas con ese nombre.</Text>
              </View>
            }
          />
        </>
      )}

      <BottomNav activeTab="all" onTabPress={onTabPress} />

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
    gap: 16
  },
  header: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  kicker: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '800'
  },
  title: {
    marginTop: 3,
    color: colors.text.primary,
    fontSize: 26,
    fontWeight: '800'
  },
  searchBox: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.background.border,
    backgroundColor: colors.background.card
  },
  searchIcon: {
    width: 18,
    height: 18
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 15
  },
  list: {
    gap: 10,
    paddingBottom: 26
  },
  emptyList: {
    flexGrow: 1
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center'
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center'
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
  }
});
