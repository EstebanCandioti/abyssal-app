import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export function AbyssalBackground() {
  return (
    <View pointerEvents="none" style={styles.container}>
      <Image source={require('../assets/whale_silhouette_eqaey.png')} style={styles.whale} resizeMode="contain" />
      <Image source={require('../assets/jellyfish_design_01_Nrtwv.png')} style={styles.jellyfish} resizeMode="contain" />
      <Image source={require('../assets/crab_silhouette_svg_ezmRC.png')} style={styles.crab} resizeMode="contain" />
      <Image source={require('../assets/seashell_pair_cOxvm.png')} style={styles.seashell} resizeMode="contain" />

      <Svg width={220} height={360} viewBox="0 0 220 360" style={styles.bubbles}>
        <Circle cx={176} cy={44} r={9} fill="#1e3a5f" opacity={0.05} />
        <Circle cx={145} cy={96} r={5} fill="#1e3a5f" opacity={0.05} />
        <Circle cx={28} cy={238} r={7} fill="#1e3a5f" opacity={0.05} />
        <Circle cx={64} cy={304} r={4} fill="#1e3a5f" opacity={0.05} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject
  },
  whale: {
    position: 'absolute',
    top: 120,
    right: -70,
    width: 285,
    height: 138,
    opacity: 0.28
  },
  jellyfish: {
    position: 'absolute',
    left: 14,
    bottom: 225,
    width: 88,
    height: 146,
    opacity: 0.36
  },
  crab: {
    position: 'absolute',
    right: 7,
    bottom: 155,
    width: 92,
    height: 84,
    opacity: 0.32
  },
  seashell: {
    position: 'absolute',
    left: 80,
    bottom: 78,
    width: 78,
    height: 64,
    opacity: 0.32
  },
  bubbles: {
    position: 'absolute',
    right: 0,
    top: 88
  }
});
