import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  interpolate,
  interpolateColor,
  Extrapolate,
} from 'react-native-reanimated';
import { AvatarProps, getVitalityLevel } from './types';

export function RobotAvatar({ 
  vitality, 
  size = 120, 
  animated = true, 
  showBorder = true,
  style 
}: AvatarProps) {
  const level = getVitalityLevel(vitality);
  
  // Animation values
  const glow = useSharedValue(0);
  const scan = useSharedValue(0);
  const power = useSharedValue(1);
  const circuit = useSharedValue(0);
  const spark = useSharedValue(0);
  const malfunction = useSharedValue(0);
  
  // Get robot configuration based on vitality level
  const getRobotConfig = () => {
    switch (level) {
      case 'critical':
        return {
          face: '🤖',
          eyes: '❌❌', // Offline eyes
          backgroundColor: '#1f2937',
          borderColor: '#dc2626',
          glowColor: '#dc2626',
          description: 'System failure! 🚨',
          status: 'OFFLINE',
          indicators: ['🚨', '💀', '⚠️'],
          powerLevel: 0.1,
        };
      case 'low':
        return {
          face: '🤖',
          eyes: '😴😴', // Sleepy eyes
          backgroundColor: '#374151',
          borderColor: '#f59e0b',
          glowColor: '#f59e0b',
          description: 'Low battery 🔋',
          status: 'POWER SAVE',
          indicators: ['🔋', '😴', '⚡'],
          powerLevel: 0.3,
        };
      case 'medium':
        return {
          face: '🤖',
          eyes: '◉◉', // Normal eyes
          backgroundColor: '#1e40af',
          borderColor: '#3b82f6',
          glowColor: '#3b82f6',
          description: 'Systems nominal ✅',
          status: 'NORMAL',
          indicators: ['✅', '💙', '⚙️'],
          powerLevel: 0.6,
        };
      case 'high':
        return {
          face: '🤖',
          eyes: '●●', // Bright eyes
          backgroundColor: '#059669',
          borderColor: '#10b981',
          glowColor: '#10b981',
          description: 'Optimized performance! ⚡',
          status: 'OPTIMAL',
          indicators: ['⚡', '🟢', '🔧'],
          powerLevel: 0.8,
        };
      case 'perfect':
        return {
          face: '🤖',
          eyes: '★★', // Star eyes
          backgroundColor: '#7c3aed',
          borderColor: '#a855f7',
          glowColor: '#a855f7',
          description: 'Maximum efficiency! 🚀',
          status: 'OVERCLOCKED',
          indicators: ['🚀', '⭐', '💎', '⚡'],
          powerLevel: 1.0,
        };
    }
  };
  
  const config = getRobotConfig();
  
  useEffect(() => {
    if (!animated) return;
    
    // Set power level
    power.value = withSpring(config.powerLevel, {
      damping: 8,
      stiffness: 50,
    });
    
    // Different animations based on vitality level
    switch (level) {
      case 'critical':
        // Flickering, malfunctioning
        malfunction.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 2000 }),
            withTiming(1, { duration: 100 }),
            withTiming(0, { duration: 100 }),
            withTiming(1, { duration: 50 }),
            withTiming(0, { duration: 50 })
          ),
          -1,
          false
        );
        
        glow.value = withRepeat(
          withSequence(
            withTiming(0.3, { duration: 3000 }),
            withTiming(0, { duration: 200 }),
            withTiming(0.1, { duration: 200 })
          ),
          -1,
          false
        );
        break;
        
      case 'low':
        // Slow, dim pulsing
        glow.value = withRepeat(
          withSequence(
            withTiming(0.4, { duration: 2500 }),
            withTiming(0.1, { duration: 2500 })
          ),
          -1,
          false
        );
        
        scan.value = withRepeat(
          withTiming(1, { duration: 8000 }),
          -1,
          false
        );
        break;
        
      case 'medium':
        // Steady, moderate glow
        glow.value = withRepeat(
          withSequence(
            withTiming(0.7, { duration: 2000 }),
            withTiming(0.4, { duration: 2000 })
          ),
          -1,
          false
        );
        
        scan.value = withRepeat(
          withTiming(1, { duration: 4000 }),
          -1,
          false
        );
        
        circuit.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 3000 }),
            withTiming(1, { duration: 500 }),
            withTiming(0, { duration: 500 })
          ),
          -1,
          false
        );
        break;
        
      case 'high':
        // Bright, energetic pulsing
        glow.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 1500 }),
            withTiming(0.6, { duration: 1500 })
          ),
          -1,
          false
        );
        
        scan.value = withRepeat(
          withTiming(1, { duration: 2000 }),
          -1,
          false
        );
        
        circuit.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 1000 }),
            withTiming(0, { duration: 1000 })
          ),
          -1,
          false
        );
        
        spark.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 2000 }),
            withTiming(1, { duration: 200 }),
            withTiming(0, { duration: 200 })
          ),
          -1,
          false
        );
        break;
        
      case 'perfect':
        // Intense, rapid effects
        glow.value = withRepeat(
          withSequence(
            withTiming(1.2, { duration: 800 }),
            withTiming(0.8, { duration: 800 })
          ),
          -1,
          false
        );
        
        scan.value = withRepeat(
          withTiming(1, { duration: 1000 }),
          -1,
          false
        );
        
        circuit.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 500 }),
            withTiming(0, { duration: 500 })
          ),
          -1,
          false
        );
        
        spark.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 300 }),
            withTiming(0, { duration: 300 })
          ),
          -1,
          false
        );
        break;
    }
  }, [level, animated, glow, scan, power, circuit, spark, malfunction]);
  
  const containerStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      glow.value,
      [0, 1],
      [config.backgroundColor, config.glowColor + '40']
    );
    
    return {
      backgroundColor,
      borderColor: config.borderColor,
      shadowColor: config.glowColor,
      shadowOpacity: glow.value * 0.5,
    };
  });
  
  const robotStyle = useAnimatedStyle(() => ({
    opacity: level === 'critical' ? 
      interpolate(malfunction.value, [0, 1], [0.3, 1], Extrapolate.CLAMP) : 1,
  }));
  
  const scanStyle = useAnimatedStyle(() => ({
    opacity: scan.value,
    transform: [
      { 
        translateX: interpolate(
          scan.value, 
          [0, 1], 
          [-size / 2, size / 2], 
          Extrapolate.CLAMP
        ) 
      }
    ],
  }));
  
  const circuitStyle = useAnimatedStyle(() => ({
    opacity: circuit.value,
  }));
  
  const sparkStyle = useAnimatedStyle(() => ({
    opacity: spark.value,
    transform: [{ scale: spark.value }],
  }));
  
  const powerBarStyle = useAnimatedStyle(() => ({
    width: `${power.value * 100}%`,
    backgroundColor: power.value > 0.5 ? config.glowColor : '#dc2626',
  }));
  
  const styles = createStyles(size, config);
  
  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.avatar, containerStyle]}>
        {/* Scanning beam */}
        {level !== 'critical' && (
          <Animated.View style={[styles.scanBeam, scanStyle]} />
        )}
        
        {/* Circuit patterns */}
        <Animated.View style={[styles.circuitContainer, circuitStyle]}>
          <Text style={styles.circuit}>⚡</Text>
          <Text style={[styles.circuit, styles.circuit2]}>◉</Text>
          <Text style={[styles.circuit, styles.circuit3]}>⚡</Text>
        </Animated.View>
        
        {/* Robot face */}
        <Animated.View style={[styles.robotContainer, robotStyle]}>
          <Text style={styles.eyes}>{config.eyes}</Text>
          <Text style={styles.face}>{config.face}</Text>
        </Animated.View>
        
        {/* Spark effects for high energy */}
        {(level === 'high' || level === 'perfect') && (
          <Animated.View style={[styles.sparkContainer, sparkStyle]}>
            <Text style={styles.spark}>⚡</Text>
            <Text style={[styles.spark, styles.spark2]}>✨</Text>
            <Text style={[styles.spark, styles.spark3]}>💫</Text>
          </Animated.View>
        )}
        
        {/* Power bar */}
        <View style={styles.powerBarContainer}>
          <Animated.View style={[styles.powerBar, powerBarStyle]} />
        </View>
        
        {/* Status text */}
        <Text style={[styles.status, { color: config.borderColor }]}>
          {config.status}
        </Text>
        
        {/* Vitality percentage */}
        <View style={styles.vitalityBadge}>
          <Text style={styles.vitalityText}>{vitality}%</Text>
        </View>
        
        {/* Status indicators */}
        {config.indicators.map((indicator, index) => (
          <Text 
            key={index}
            style={[
              styles.indicator,
              {
                top: 10 + (index * 15),
                right: 5 + (index * 8),
                opacity: level === 'critical' ? 0.3 : 0.8,
              }
            ]}
          >
            {indicator}
          </Text>
        ))}
      </Animated.View>
      
      {/* Description */}
      <Text style={[styles.description, { color: config.borderColor }]}>
        {config.description}
      </Text>
    </View>
  );
}

const createStyles = (size: number, config: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatar: {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  scanBeam: {
    position: 'absolute',
    width: 2,
    height: size * 0.8,
    backgroundColor: config.glowColor,
    top: size * 0.1,
  },
  circuitContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circuit: {
    position: 'absolute',
    fontSize: 8,
    color: config.glowColor,
  },
  circuit2: {
    top: size * 0.2,
    left: size * 0.15,
  },
  circuit3: {
    bottom: size * 0.2,
    right: size * 0.15,
  },
  robotContainer: {
    alignItems: 'center',
  },
  eyes: {
    fontSize: size * 0.08,
    marginBottom: 2,
    color: config.glowColor,
  },
  face: {
    fontSize: size * 0.35,
  },
  sparkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spark: {
    position: 'absolute',
    fontSize: 16,
    color: config.glowColor,
  },
  spark2: {
    top: -10,
    left: -15,
    fontSize: 12,
  },
  spark3: {
    bottom: -10,
    right: -15,
    fontSize: 14,
  },
  powerBarContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
  },
  powerBar: {
    height: '100%',
    borderRadius: 2,
  },
  status: {
    position: 'absolute',
    bottom: -20,
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
  vitalityBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  vitalityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    fontSize: 8,
  },
  description: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
});