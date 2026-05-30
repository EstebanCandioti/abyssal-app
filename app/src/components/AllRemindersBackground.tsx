import { StyleSheet, View } from 'react-native';
import { Asset } from 'expo-asset';
import Svg, { Circle } from 'react-native-svg';
import { SvgUri } from 'react-native-svg';

const clownfishUri = Asset.fromModule(require('../assets/clownfish.svg')).uri;
const coralUri = Asset.fromModule(require('../assets/coral2_new.svg')).uri;
const seahorseUri = Asset.fromModule(require('../assets/seahorse-silhouette-svgrepo-com.svg')).uri;
const turtleUri = Asset.fromModule(require('../assets/turtle_silhouette_h4jaH.svg')).uri;

export function AllRemindersBackground() {
  return (
    <View pointerEvents="none" style={styles.container}>
      <SvgUri uri={clownfishUri} width={148} height={88} style={styles.clownfish} />
      <SvgUri uri={seahorseUri} width={191} height={191} style={styles.seahorse} />
      <SvgUri uri={turtleUri} width={138} height={132} style={styles.turtle} />
      <SvgUri uri={coralUri} width={150} height={150} style={styles.coral} />

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
    opacity: 0.22
  },
  coral: {
    position: 'absolute',
    left: -16,
    bottom: 80,
    opacity: 0.34
  },
  seahorse: {
    position: 'absolute',
    left: -26,
    top: 240,
    opacity: 0.3
  },
  turtle: {
    position: 'absolute',
    right: 10,
    bottom: 183,
    opacity: 0.3
  },
  bubbles: {
    position: 'absolute',
    right: 0,
    top: 80
  }
});
