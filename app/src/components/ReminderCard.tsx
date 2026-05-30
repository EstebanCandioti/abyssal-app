import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line } from 'react-native-svg';
import { colors } from '../constants/theme';
import type { Reminder, WeekDay } from '../services/api';

interface Props {
  reminder: Reminder;
  onToggle?: (id: number) => void;
  onPress: (reminder: Reminder) => void;
  showChecker?: boolean;
  toggleDisabled?: boolean;
}

type AnimationKind = 'bubble' | 'ripple' | 'sonar' | 'ink';

const animations: AnimationKind[] = ['bubble', 'ripple', 'sonar', 'ink'];
let lastAnimationIndex = -1;

const dayLabels: Record<WeekDay, string> = {
  mon: 'Lun',
  tue: 'Mar',
  wed: 'Mie',
  thu: 'Jue',
  fri: 'Vie',
  sat: 'Sab',
  sun: 'Dom'
};

function formatFrequency(reminder: Reminder) {
  if (reminder.frequencyType === 'weekly') {
    if ((reminder.frequencyDays ?? []).length === 7) {
      return 'Todos los dias';
    }

    return (reminder.frequencyDays ?? []).map((day) => dayLabels[day]).join(' · ');
  }

  if (reminder.frequencyType === 'weekly_interval') {
    const interval = reminder.frequencyInterval ?? 1;
    const day = reminder.frequencyDays?.[0];
    return `Cada ${interval} ${interval === 1 ? 'semana' : 'semanas'}${day ? ` · ${dayLabels[day]}` : ''}`;
  }

  return `Cada ${reminder.frequencyInterval} dias`;
}

function getTimeParts(time: string) {
  const [hour = '00', minute = '00'] = time.split(':');
  const hourNumber = Number(hour);
  const period = hourNumber >= 12 ? 'PM' : 'AM';
  return { time: `${hour}:${minute}`, period };
}

function pickAnimation() {
  let index = Math.floor(Math.random() * animations.length);

  if (index === lastAnimationIndex) {
    index = (index + 1 + Math.floor(Math.random() * (animations.length - 1))) % animations.length;
  }

  lastAnimationIndex = index;
  return animations[index];
}

export function ReminderCard({ reminder, onToggle, onPress, showChecker = true, toggleDisabled = false }: Props) {
  const timeParts = getTimeParts(reminder.time);
  const [done, setDone] = useState(Boolean(reminder.completedToday));
  const [activeAnimation, setActiveAnimation] = useState<AnimationKind | null>(null);
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });
  const [checkerCenter, setCheckerCenter] = useState({ x: 0, y: 0 });
  const animating = useRef(false);

  const doneProgress = useRef(new Animated.Value(reminder.completedToday ? 1 : 0)).current;
  const checkerScale = useRef(new Animated.Value(1)).current;
  const bubbleProgress = useRef(new Animated.Value(0)).current;
  const rippleProgress = useRef(new Animated.Value(0)).current;
  const inkProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setDone(Boolean(reminder.completedToday));
    doneProgress.setValue(reminder.completedToday ? 1 : 0);
  }, [doneProgress, reminder.completedToday]);

  const finishTransition = () => {
    setDone(true);
    Animated.timing(doneProgress, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true
    }).start(() => {
      animating.current = false;
      setActiveAnimation(null);
      onToggle?.(reminder.id);
    });
  };

  const finishSonarTransition = () => {
    setActiveAnimation(null);
    setDone(true);
    Animated.timing(doneProgress, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true
    }).start(() => {
      animating.current = false;
      onToggle?.(reminder.id);
    });
  };

  const runResurface = () => {
    setDone(false);
    checkerScale.setValue(0.92);
    Animated.parallel([
      Animated.timing(doneProgress, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true
      }),
      Animated.sequence([
        Animated.spring(checkerScale, {
          toValue: 1.16,
          friction: 5,
          tension: 130,
          useNativeDriver: true
        }),
        Animated.spring(checkerScale, {
          toValue: 1,
          friction: 6,
          tension: 120,
          useNativeDriver: true
        })
      ])
    ]).start(() => {
      animating.current = false;
      onToggle?.(reminder.id);
    });
  };

  const runAnimation = (kind: AnimationKind) => {
    setActiveAnimation(kind);

    if (kind === 'bubble') {
      bubbleProgress.setValue(0);
      Animated.timing(bubbleProgress, {
        toValue: 1,
        duration: 620,
        useNativeDriver: true
      }).start(finishTransition);
      return;
    }

    if (kind === 'ripple') {
      rippleProgress.setValue(0);
      Animated.timing(rippleProgress, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true
      }).start(finishTransition);
      return;
    }

    if (kind === 'sonar') {
      return;
    }

    inkProgress.setValue(0);
    Animated.timing(inkProgress, {
      toValue: 1,
      duration: 560,
      useNativeDriver: true
    }).start(finishTransition);
  };

  const handleCheckPress = () => {
    if (animating.current || toggleDisabled) {
      return;
    }

    animating.current = true;

    if (done) {
      runResurface();
      return;
    }

    runAnimation(pickAnimation());
  };

  const doneCardStyle = {
    opacity: doneProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.45]
    }),
    transform: [{
      translateY: doneProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 5]
      })
    }]
  };

  return (
    <Animated.View
      style={[styles.card, doneCardStyle]}
      onLayout={(event) => {
        setCardSize({
          width: event.nativeEvent.layout.width,
          height: event.nativeEvent.layout.height
        });
      }}
    >
      <View pointerEvents="none" style={styles.animationLayer}>
        {activeAnimation === 'bubble' ? <BubbleBurst progress={bubbleProgress} /> : null}
        {activeAnimation === 'ripple' ? (
          <RippleBurst progress={rippleProgress} center={checkerCenter} cardSize={cardSize} />
        ) : null}
        {activeAnimation === 'ink' ? <InkDrop progress={inkProgress} /> : null}
      </View>

      <Pressable style={styles.openArea} onPress={() => onPress(reminder)}>
        <View style={styles.timeColumn}>
          <Text style={styles.time}>{timeParts.time}</Text>
          <Text style={styles.period}>{timeParts.period}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.content}>
          <Text style={[styles.title, done && styles.titleDone]}>{reminder.title}</Text>
          {reminder.description ? <Text style={styles.description}>{reminder.description}</Text> : null}
          <View style={styles.metaRow}>
            <View style={styles.pill}>
              <Ionicons name="time-outline" size={12} color={colors.text.secondary} />
              <Text style={styles.frequency} numberOfLines={1}>{formatFrequency(reminder)}</Text>
            </View>
            {done ? (
              <View style={styles.sentPill}>
                <View style={styles.sentDot} />
                <Text style={styles.frequency} numberOfLines={1}>Hecho</Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={15} color={colors.text.secondary} />
          </View>
        </View>
      </Pressable>

      {showChecker ? (
        <Animated.View
          style={{ transform: [{ scale: checkerScale }] }}
          onLayout={(event) => {
            const { x, y, width, height } = event.nativeEvent.layout;
            setCheckerCenter({ x: x + width / 2, y: y + height / 2 });
          }}
        >
          <Pressable
            style={[styles.completeButton, done && styles.completeButtonDone, toggleDisabled && styles.completeButtonDisabled]}
            onPress={handleCheckPress}
            disabled={toggleDisabled}
          >
            {activeAnimation === 'sonar' ? (
              <SonarSweep onComplete={finishSonarTransition} />
            ) : done ? (
              <Ionicons name="checkmark" size={19} color={colors.text.primary} />
            ) : null}
          </Pressable>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

function getPoint(angle: number, radius: number, center = 16) {
  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius
  };
}

function SonarSweep({ onComplete }: { onComplete: () => void }) {
  const [angle, setAngle] = useState(-Math.PI / 2);
  const completed = useRef(false);

  useEffect(() => {
    let frameId = 0;
    let startTime: number | null = null;
    const duration = 900;
    const startAngle = -Math.PI / 2;
    const totalRotation = Math.PI * 3;

    const animate = (timestamp: number) => {
      startTime ??= timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setAngle(startAngle + totalRotation * progress);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
        return;
      }

      if (!completed.current) {
        completed.current = true;
        onComplete();
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [onComplete]);

  const center = 16;
  const radius = 14;
  const sweepEnd = getPoint(angle, radius * 0.85, center);
  const trail = Array.from({ length: 12 }, (_, index) => {
    const trailAngle = angle - (index / 11) * ((Math.PI * 2) / 3);
    const end = getPoint(trailAngle, radius * 0.85, center);
    return {
      key: index,
      end,
      opacity: 0.45 * (1 - index / 12)
    };
  });

  return (
    <View pointerEvents="none" style={styles.sonarLayer}>
      <Svg width="100%" height="100%" viewBox="0 0 32 32">
        <Circle cx={center} cy={center} r={16} fill="#071828" />
        <Circle cx={center} cy={center} r={radius * 0.35} fill="none" stroke="rgba(100,180,120,0.15)" strokeWidth={1} />
        <Circle cx={center} cy={center} r={radius * 0.7} fill="none" stroke="rgba(100,180,120,0.15)" strokeWidth={1} />
        <Line x1={center - radius} y1={center} x2={center + radius} y2={center} stroke="rgba(100,180,120,0.15)" strokeWidth={1} />
        <Line x1={center} y1={center - radius} x2={center} y2={center + radius} stroke="rgba(100,180,120,0.15)" strokeWidth={1} />
        {trail.map((item) => (
          <Line
            key={item.key}
            x1={center}
            y1={center}
            x2={item.end.x}
            y2={item.end.y}
            stroke={`rgba(80,200,120,${item.opacity})`}
            strokeWidth={1.4}
            strokeLinecap="round"
          />
        ))}
        <Line
          x1={center}
          y1={center}
          x2={sweepEnd.x}
          y2={sweepEnd.y}
          stroke="rgba(100,220,140,0.95)"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <Circle cx={sweepEnd.x} cy={sweepEnd.y} r={1.8} fill="rgba(140,255,160,1)" />
      </Svg>
    </View>
  );
}

function BubbleBurst({ progress }: { progress: Animated.Value }) {
  const bubbles = [
    { x: -18, y: -42, size: 8 },
    { x: -6, y: -58, size: 5 },
    { x: 8, y: -46, size: 7 },
    { x: 17, y: -66, size: 4 },
    { x: 0, y: -34, size: 6 }
  ];

  return (
    <>
      {bubbles.map((bubble, index) => (
        <Animated.View
          key={`${bubble.x}-${bubble.y}-${index}`}
          style={[
            styles.bubbleParticle,
            {
              width: bubble.size,
              height: bubble.size,
              borderRadius: bubble.size / 2,
              opacity: progress.interpolate({
                inputRange: [0, 0.2, 1],
                outputRange: [0, 1, 0]
              }),
              transform: [
                { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, bubble.x] }) },
                { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, bubble.y] }) },
                { scale: progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.4, 1, 0.6] }) }
              ]
            }
          ]}
        />
      ))}
    </>
  );
}

function RippleBurst({
  progress,
  center,
  cardSize
}: {
  progress: Animated.Value;
  center: { x: number; y: number };
  cardSize: { width: number; height: number };
}) {
  const checkerSize = 34;
  const origin = center.x > 0 && center.y > 0
    ? center
    : { x: cardSize.width - 29, y: cardSize.height / 2 };
  const diagonal = Math.sqrt((cardSize.width || checkerSize) ** 2 + (cardSize.height || checkerSize) ** 2);
  const maxScale = Math.max(2.3, diagonal / checkerSize);

  return (
    <>
      {[0, 1].map((index) => (
        <Animated.View
          key={index}
          style={[
            styles.rippleRing,
            {
              left: origin.x - checkerSize / 2,
              top: origin.y - checkerSize / 2,
              opacity: progress.interpolate({
                inputRange: [0, 0.25 + index * 0.12, 1],
                outputRange: [0.8, 0.45, 0]
              }),
              transform: [{
                scale: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1 + index * 0.08, maxScale + index * 0.6]
                })
              }]
            }
          ]}
        />
      ))}
    </>
  );
}

function InkDrop({ progress }: { progress: Animated.Value }) {
  return (
    <Animated.View
      style={[
        styles.inkDrop,
        {
          opacity: progress.interpolate({
            inputRange: [0, 0.28, 1],
            outputRange: [0, 0.55, 0]
          }),
          transform: [{
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, 3.6]
            })
          }]
        }
      ]}
    />
  );
}

const checkerCenter = {
  right: 28,
  top: '50%' as const,
  marginTop: -4
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 72,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.background.border,
    backgroundColor: colors.background.card
  },
  animationLayer: {
    ...StyleSheet.absoluteFillObject
  },
  openArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'stretch'
  },
  timeColumn: {
    width: 58,
    justifyContent: 'center',
    gap: 2
  },
  time: {
    color: colors.text.accent,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0
  },
  period: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: '700'
  },
  divider: {
    alignSelf: 'stretch',
    width: 1,
    backgroundColor: colors.background.border
  },
  content: {
    flex: 1,
    gap: 4
  },
  title: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '700'
  },
  titleDone: {
    color: '#4a7ab5',
    textDecorationLine: 'line-through'
  },
  description: {
    color: colors.text.primary,
    fontSize: 12,
    lineHeight: 16
  },
  frequency: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: '700'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap'
  },
  pill: {
    maxWidth: 128,
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#15385f'
  },
  sentPill: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  sentDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.text.secondary
  },
  completeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.background.border,
    overflow: 'hidden'
  },
  completeButtonDone: {
    borderColor: '#3a8a6a',
    backgroundColor: '#1a4a60'
  },
  completeButtonDisabled: {
    opacity: 0.55
  },
  sonarLayer: {
    position: 'absolute',
    top: 1,
    right: 1,
    bottom: 1,
    left: 1,
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#071828'
  },
  bubbleParticle: {
    position: 'absolute',
    ...checkerCenter,
    borderWidth: 1,
    borderColor: colors.text.accent,
    backgroundColor: 'rgba(168, 200, 240, 0.2)'
  },
  rippleRing: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.text.accent
  },
  inkDrop: {
    position: 'absolute',
    ...checkerCenter,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#020a10'
  }
});
