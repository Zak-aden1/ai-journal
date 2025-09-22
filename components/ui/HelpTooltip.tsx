import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

interface HelpTooltipProps {
  title: string;
  content: string;
  children?: React.ReactNode;
  icon?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function HelpTooltip({
  title,
  content,
  children,
  icon = '?',
  position = 'bottom'
}: HelpTooltipProps) {
  const [visible, setVisible] = useState(false);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const showTooltip = () => {
    setVisible(true);
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 200 });
  };

  const hideTooltip = () => {
    scale.value = withSpring(0, { damping: 15, stiffness: 200 });
    opacity.value = withTiming(0, { duration: 150 }, () => {
      runOnJS(setVisible)(false);
    });
  };

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const triggerComponent = children || (
    <TouchableOpacity style={styles.defaultTrigger} onPress={showTooltip}>
      <Text style={styles.triggerIcon}>{icon}</Text>
    </TouchableOpacity>
  );

  return (
    <>
      {React.cloneElement(triggerComponent as React.ReactElement, {
        onPress: showTooltip
      })}

      <Modal visible={visible} transparent animationType="none">
        <Pressable style={styles.overlay} onPress={hideTooltip}>
          <View style={styles.container}>
            <Animated.View style={[styles.tooltip, animatedModalStyle]}>
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity onPress={hideTooltip} style={styles.closeButton}>
                  <Text style={styles.closeIcon}>×</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.content}>{content}</Text>

              {/* Arrow indicator */}
              <View style={[styles.arrow, getArrowStyle(position)]} />
            </Animated.View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function getArrowStyle(position: 'top' | 'bottom' | 'left' | 'right') {
  switch (position) {
    case 'top':
      return {
        bottom: -8,
        left: '50%',
        marginLeft: -8,
        borderTopColor: '#1f2937',
        borderTopWidth: 8,
        borderLeftWidth: 8,
        borderRightWidth: 8,
      };
    case 'bottom':
      return {
        top: -8,
        left: '50%',
        marginLeft: -8,
        borderBottomColor: '#1f2937',
        borderBottomWidth: 8,
        borderLeftWidth: 8,
        borderRightWidth: 8,
      };
    case 'left':
      return {
        right: -8,
        top: '50%',
        marginTop: -8,
        borderLeftColor: '#1f2937',
        borderLeftWidth: 8,
        borderTopWidth: 8,
        borderBottomWidth: 8,
      };
    case 'right':
      return {
        left: -8,
        top: '50%',
        marginTop: -8,
        borderRightColor: '#1f2937',
        borderRightWidth: 8,
        borderTopWidth: 8,
        borderBottomWidth: 8,
      };
  }
}

const styles = StyleSheet.create({
  defaultTrigger: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  triggerIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    maxWidth: 300,
    width: '100%',
  },
  tooltip: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  content: {
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 20,
  },

  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
});