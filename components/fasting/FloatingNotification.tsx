import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { useFasting } from '@/hooks/useFasting';
import { IconSymbol } from '@/components/ui/icon-symbol';

export const FloatingNotification: React.FC = () => {
  const { currentFast } = useFasting();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentFast) {
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.spring(animation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [currentFast]);

  const formatTimeRemaining = () => {
    if (!currentFast) return '00:00:00';
    
    const elapsed = currentTime.getTime() - currentFast.startTime.getTime();
    const target = currentFast.targetDuration * 60 * 60 * 1000;
    const remaining = Math.max(target - elapsed, 0);
    
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
    
    if (remaining === 0) {
      // Show elapsed time after target
      const overtime = elapsed - target;
      const overtimeHours = Math.floor(overtime / (60 * 60 * 1000));
      const overtimeMinutes = Math.floor((overtime % (60 * 60 * 1000)) / (60 * 1000));
      const overtimeSeconds = Math.floor((overtime % (60 * 1000)) / 1000);
      return `+${overtimeHours.toString().padStart(2, '0')}:${overtimeMinutes.toString().padStart(2, '0')}:${overtimeSeconds.toString().padStart(2, '0')}`;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentFast) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0],
              }),
            },
            {
              scale: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
          opacity: animation,
        },
      ]}
      pointerEvents={currentFast ? 'auto' : 'none'}
    >
      <TouchableOpacity style={styles.notification} activeOpacity={0.9}>
        <View style={styles.iconContainer}>
          <Text style={styles.fireIcon}>🔥</Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title}>Fasting in progress</Text>
          <Text style={styles.time}>{formatTimeRemaining()}</Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <IconSymbol name="pause.circle.fill" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  notification: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  fireIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  time: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actions: {
    marginLeft: 12,
  },
  actionButton: {
    padding: 4,
  },
});