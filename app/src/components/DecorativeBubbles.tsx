import { StyleSheet, View } from 'react-native';
import { colors } from '../constants/theme';

export function DecorativeBubbles() {
  return (
    <View style={styles.row}>
      <View style={[styles.bubble, styles.large]} />
      <View style={styles.bubble} />
      <View style={[styles.bubble, styles.small]} />
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  bubble: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.text.secondary
  },
  large: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderColor: colors.text.accent
  },
  small: {
    width: 5,
    height: 5,
    borderRadius: 3
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.background.border
  }
});
