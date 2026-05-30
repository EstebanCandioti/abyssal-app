import { StyleSheet, View } from 'react-native';
import { Asset } from 'expo-asset';
import Svg, { Circle } from 'react-native-svg';
import { SvgUri } from 'react-native-svg';

const whaleUri = Asset.fromModule(require('../assets/whale_silhouette_eqaey.svg')).uri;
const jellyfishUri = Asset.fromModule(require('../assets/jellyfish_design_01_Nrtwv.svg')).uri;
const crabUri = Asset.fromModule(require('../assets/crab_silhouette_svg_ezmRC.svg')).uri;
const seashellUri = Asset.fromModule(require('../assets/seashell_pair_cOxvm.svg')).uri;

export function AbyssalBackground() {
  return (
    <View pointerEvents="none" style={styles.container}>
      <SvgUri uri={whaleUri} width={285} height={138} style={styles.whale} />
      <SvgUri uri={jellyfishUri} width={88} height={146} style={styles.jellyfish} />
      <SvgUri uri={crabUri} width={92} height={84} style={styles.crab} />
      <SvgUri uri={seashellUri} width={78} height={64} style={styles.seashell} />

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
    opacity: 0.28
  },
  jellyfish: {
    position: 'absolute',
    left: 14,
    bottom: 225,
    opacity: 0.36
  },
  crab: {
    position: 'absolute',
    right: 7,
    bottom: 155,
    opacity: 0.32
  },
  seashell: {
    position: 'absolute',
    left: 80,
    bottom: 78,
    opacity: 0.32
  },
  bubbles: {
    position: 'absolute',
    right: 0,
    top: 88
  }
});
