import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';

export type MainTab = 'home' | 'all' | 'settings';

interface Props {
  activeTab: MainTab;
  onTabPress: (tab: MainTab) => void;
}

const items: Array<{ tab: MainTab; icon: keyof typeof Ionicons.glyphMap; label: string }> = [
  { tab: 'home', icon: 'home-outline', label: 'Inicio' },
  { tab: 'all', icon: 'list-outline', label: 'Todos' },
  { tab: 'settings', icon: 'options-outline', label: 'Ajustes' }
];

export function BottomNav({ activeTab, onTabPress }: Props) {
  return (
    <View style={styles.bottomBar}>
      {items.map((item) => {
        const active = item.tab === activeTab;
        return (
          <Pressable key={item.tab} style={styles.tabItem} onPress={() => onTabPress(item.tab)}>
            <Ionicons
              name={item.icon}
              size={item.tab === 'home' ? 20 : 21}
              color={active ? colors.text.accent : colors.text.secondary}
            />
            <Text style={active ? styles.tabTextActive : styles.tabText}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 18,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 8,
    backgroundColor: '#070f1e'
  },
  tabItem: {
    width: 76,
    alignItems: 'center',
    gap: 4
  },
  tabText: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: '700'
  },
  tabTextActive: {
    color: colors.text.accent,
    fontSize: 11,
    fontWeight: '800'
  }
});
