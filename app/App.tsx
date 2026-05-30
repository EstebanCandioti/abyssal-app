import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './src/constants/theme';
import { type MainTab } from './src/components/BottomNav';
import { HomeScreen } from './src/screens/HomeScreen';
import { AllRemindersScreen } from './src/screens/AllRemindersScreen';
import { CreateReminderScreen } from './src/screens/CreateReminderScreen';
import { ReminderDetailScreen } from './src/screens/ReminderDetailScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { api } from './src/services/api';
import { syncLocalReminderNotifications } from './src/services/localNotifications';

type Screen = MainTab | 'create' | 'detail';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [selectedReminderId, setSelectedReminderId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const syncNotifications = useCallback(async () => {
    try {
      const settings = await api.getSettings();
      const reminders = await api.getReminders();
      await syncLocalReminderNotifications(reminders, settings.pushNotificationsEnabled);
    } catch {
      // La app no debe bloquear la UI si las notificaciones locales no estan disponibles.
    }
  }, []);

  useEffect(() => {
    void syncNotifications();
  }, [syncNotifications]);

  const goActiveTabAndRefresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
    setSelectedReminderId(null);
    setScreen(activeTab);
    void syncNotifications();
  }, [activeTab, syncNotifications]);

  const handleTabPress = useCallback((tab: MainTab) => {
    setActiveTab(tab);
    setSelectedReminderId(null);
    setScreen(tab);
  }, []);

  const handleReminderPress = useCallback((id: number) => {
    setSelectedReminderId(id);
    setScreen('detail');
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'bottom', 'left']}>
        <StatusBar style="light" backgroundColor={colors.background.primary} />
        <View style={styles.container}>
          {screen === 'home' ? (
            <HomeScreen
              key={`home-${refreshKey}`}
              onCreatePress={() => setScreen('create')}
              onReminderPress={handleReminderPress}
              onTabPress={handleTabPress}
            />
          ) : null}
          {screen === 'all' ? (
            <AllRemindersScreen
              key={`all-${refreshKey}`}
              onCreatePress={() => setScreen('create')}
              onReminderPress={handleReminderPress}
              onTabPress={handleTabPress}
            />
          ) : null}
          {screen === 'settings' ? (
            <SettingsScreen onTabPress={handleTabPress} />
          ) : null}
          {screen === 'create' ? (
            <CreateReminderScreen onCancel={() => setScreen(activeTab)} onCreated={goActiveTabAndRefresh} />
          ) : null}
          {screen === 'detail' && selectedReminderId ? (
            <ReminderDetailScreen
              reminderId={selectedReminderId}
              onBack={goActiveTabAndRefresh}
              onDeleted={goActiveTabAndRefresh}
            />
          ) : null}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.primary
  }
});
