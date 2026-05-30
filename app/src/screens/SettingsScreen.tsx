import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { BottomNav, type MainTab } from '../components/BottomNav';
import { api, type Settings } from '../services/api';
import {
  clearLocalReminderNotifications,
  ensureLocalNotificationPermission,
  syncLocalReminderNotifications
} from '../services/localNotifications';

interface Props {
  onTabPress: (tab: MainTab) => void;
}

export function SettingsScreen({ onTabPress }: Props) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      setError(null);

      try {
        const nextSettings = await api.getSettings();
        setSettings(nextSettings);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los ajustes.');
      } finally {
        setLoading(false);
      }
    }

    void loadSettings();
  }, []);

  const persistSettings = async (input: Partial<Omit<Settings, 'updatedAt'>>) => {
    setSaving(true);
    setError(null);
    setSavedMessage(null);

    try {
      const updated = await api.updateSettings(input);
      setSettings(updated);
      setSavedMessage('Guardado.');
      return updated;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudieron guardar los ajustes.');
      throw saveError;
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEmail = async (enabled: boolean) => {
    const previous = settings;
    if (!previous) {
      return;
    }

    setSettings({ ...previous, emailEnabled: enabled });
    await persistSettings({ emailEnabled: enabled }).catch(() => setSettings(previous));
  };

  const handleTogglePush = async (enabled: boolean) => {
    const previous = settings;
    if (!previous) {
      return;
    }

    if (enabled) {
      const permissionGranted = await ensureLocalNotificationPermission();
      if (!permissionGranted) {
        setError('Permiso de notificaciones denegado.');
        return;
      }
    }

    setSettings({ ...previous, pushNotificationsEnabled: enabled });
    await persistSettings({ pushNotificationsEnabled: enabled })
      .then(async () => {
        if (!enabled) {
          await clearLocalReminderNotifications();
          return;
        }

        const reminders = await api.getReminders();
        await syncLocalReminderNotifications(reminders, true);
      })
      .catch(() => setSettings(previous));
  };

  return (
    <LinearGradient colors={['#0d2a4a', '#071828', '#020a10']} locations={[0, 0.48, 1]} style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Abyssal</Text>
          <Text style={styles.title}>Ajustes</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.text.accent} />
          </View>
        ) : settings ? (
          <View style={styles.sections}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="mail-outline" size={18} color={colors.text.accent} />
                  <Text style={styles.sectionTitle}>Email</Text>
                </View>
                <Switch
                  value={settings.emailEnabled}
                  onValueChange={handleToggleEmail}
                  disabled={saving}
                  trackColor={{ false: colors.background.border, true: '#1a4a60' }}
                  thumbColor={settings.emailEnabled ? colors.text.accent : colors.text.secondary}
                />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="notifications-outline" size={18} color={colors.text.accent} />
                  <Text style={styles.sectionTitle}>Notificaciones locales</Text>
                </View>
                <Switch
                  value={settings.pushNotificationsEnabled}
                  onValueChange={handleTogglePush}
                  disabled={saving}
                  trackColor={{ false: colors.background.border, true: '#1a4a60' }}
                  thumbColor={settings.pushNotificationsEnabled ? colors.text.accent : colors.text.secondary}
                />
              </View>
            </View>
          </View>
        ) : null}

        {error ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{error}</Text>
          </View>
        ) : null}

        {savedMessage ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{savedMessage}</Text>
          </View>
        ) : null}
      </View>

      <BottomNav activeTab="settings" onTabPress={onTabPress} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 92
  },
  content: {
    flex: 1,
    gap: 18
  },
  header: {
    minHeight: 96,
    justifyContent: 'center'
  },
  kicker: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '800'
  },
  title: {
    marginTop: 8,
    color: colors.text.primary,
    fontSize: 30,
    fontWeight: '800'
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sections: {
    gap: 14
  },
  section: {
    gap: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.background.border,
    backgroundColor: colors.background.card
  },
  sectionHeader: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  sectionTitleRow: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  sectionTitle: {
    flexShrink: 1,
    color: colors.text.primary,
    fontSize: 17,
    fontWeight: '800'
  },
  banner: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.background.border,
    backgroundColor: colors.background.card
  },
  bannerText: {
    color: colors.text.accent,
    fontSize: 13,
    textAlign: 'center'
  }
});
