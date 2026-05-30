import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export function AllRemindersBackground() {
  return (
    <View pointerEvents="none" style={styles.container}>
      <Image source={require('../assets/clownfish.png')} style={styles.clownfish} resizeMode="contain" />
      <Image source={require('../assets/seahorse-silhouette-svgrepo-com.png')} style={styles.seahorse} resizeMode="contain" />
      <Image source={require('../assets/turtle_silhouette_h4jaH.png')} style={styles.turtle} resizeMode="contain" />
      <Image source={require('../assets/coral2_new.png')} style={styles.coral} resizeMode="contain" />

      <Svg width={220} height={360} viewBox="0 0 220 360" style={styles.bubbles}>
        <Circle cx={176} cy={44} r={8} fill="#1e3a5f" opacity={0.06} />
        <Circle cx={128} cy={118} r={5} fill="#1e3a5f" opacity={0.06} />
        <Circle cx={38} cy={248} r={7} fill="#1e3a5f" opacity={0.06} />
        <Circle cx={68} cy={310} r={4} fill="#1e3a5f" opacity={0.06} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject
  },
  clownfish: {
    position: 'absolute',
    top: 30,
    right: 0,
    width: 148,
    height: 88,
    opacity: 0.22
  },
  coral: {
    position: 'absolute',
    left: -16,
    bottom: 80,
    width: 150,
    height: 150,
    opacity: 0.34
  },
  seahorse: {
    position: 'absolute',
    left: -26,
    top: 240,
    width: 191,
    height: 191,
    opacity: 0.3
  },
  turtle: {
    position: 'absolute',
    right: 10,
    bottom: 183,
    width: 138,
    height: 132,
    opacity: 0.3
  },
  bubbles: {
    position: 'absolute',
    right: 0,
    top: 80
  }
});
