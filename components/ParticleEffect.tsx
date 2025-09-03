import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  emoji: string;
}

interface ParticleEffectProps {
  trigger: boolean;
  onComplete?: () => void;
}

export function ParticleEffect({ trigger, onComplete }: ParticleEffectProps) {
  const particles = useRef<Particle[]>([]);
  const containerRef = useRef<View>(null);
  const isMountedRef = useRef(true);

  const emojis = ['🎉', '✨', '⭐', '🌟', '💫', '🎊'];

  const createParticle = (id: number): Particle => ({
    id,
    x: new Animated.Value(Math.random() * 200 - 100),
    y: new Animated.Value(0),
    opacity: new Animated.Value(1),
    scale: new Animated.Value(0.5 + Math.random() * 0.5),
    emoji: emojis[Math.floor(Math.random() * emojis.length)],
  });

  const animateParticles = () => {
    particles.current = Array.from({ length: 8 }, (_, i) => createParticle(i));

    const animations = particles.current.map(particle =>
      Animated.parallel([
        Animated.timing(particle.y, {
          toValue: -150 - Math.random() * 100,
          duration: 1500 + Math.random() * 1000,
          useNativeDriver: false,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 1500 + Math.random() * 1000,
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.timing(particle.scale, {
            toValue: 1 + Math.random() * 0.5,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(particle.scale, {
            toValue: 0,
            duration: 1300 + Math.random() * 1000,
            useNativeDriver: false,
          }),
        ]),
      ])
    );

    Animated.parallel(animations).start(() => {
      // Clear local particles first
      particles.current = [];
      // Defer parent state updates to the next tick to avoid
      // scheduling updates during React's insertion phase
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (isMountedRef.current) {
            onComplete?.();
          }
        }, 0);
      });
    });
  };

  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (trigger) {
      animateParticles();
    }
  }, [trigger]);

  // Only render if we have particles to show
  if (particles.current.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} ref={containerRef} pointerEvents="none">
      {particles.current.map(particle => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        >
          <Animated.Text style={styles.particleEmoji}>
            {particle.emoji}
          </Animated.Text>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
    backgroundColor: 'transparent',
  },
  particle: {
    position: 'absolute',
  },
  particleEmoji: {
    fontSize: 20,
  },
});
