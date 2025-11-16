import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useFasting } from './useFasting';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const useNotifications = () => {
  const { currentFast } = useFasting();
  const notificationId = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only register for notifications if not in Expo Go
    if (!__DEV__ || process.env.NODE_ENV !== 'development') {
      registerForPushNotificationsAsync();
    }
  }, []);

  useEffect(() => {
    if (currentFast && (!__DEV__ || process.env.NODE_ENV !== 'development')) {
      startPersistentNotification();
      scheduleFastingNotifications(currentFast);
    } else {
      stopPersistentNotification();
      if (!__DEV__ || process.env.NODE_ENV !== 'development') {
        cancelAllNotifications();
      }
    }

    return () => {
      stopPersistentNotification();
    };
  }, [currentFast]);

  const registerForPushNotificationsAsync = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
    } catch (error) {
      // Silently handle the error if in Expo Go
      if (__DEV__) {
        console.log('Notifications not available in Expo Go development mode');
      }
    }
  };

  const scheduleFastingNotifications = async (fast: any) => {
    // Cancel any existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    const targetTime = new Date(fast.startTime.getTime() + fast.targetDuration * 60 * 60 * 1000);
    const now = new Date();

    // Schedule notification for when fasting goal is reached
    if (targetTime > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Fasting Goal Achieved!',
          body: `Congratulations! You've completed your ${fast.targetDuration}h fast.`,
          data: { type: 'fast_completed' },
        },
        trigger: {
          date: targetTime,
        },
      });
    }

    // Schedule motivational notifications during fasting
    const halfwayPoint = new Date(fast.startTime.getTime() + (fast.targetDuration * 60 * 60 * 1000) / 2);
    if (halfwayPoint > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔥 Halfway There!',
          body: "You're doing great! Keep up the momentum.",
          data: { type: 'motivation' },
        },
        trigger: {
          date: halfwayPoint,
        },
      });
    }

    // Fat burning notification (after 12 hours)
    const fatBurningTime = new Date(fast.startTime.getTime() + 12 * 60 * 60 * 1000);
    if (fatBurningTime > now && fast.targetDuration > 12) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔥 Fat Burning Mode Activated!',
          body: 'Your body has entered ketosis and is burning fat for energy.',
          data: { type: 'fat_burning' },
        },
        trigger: {
          date: fatBurningTime,
        },
      });
    }
  };

  const formatTimeRemaining = (fast: any) => {
    const now = new Date();
    const elapsed = now.getTime() - fast.startTime.getTime();
    const target = fast.targetDuration * 60 * 60 * 1000;
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

  const startPersistentNotification = async () => {
    if (!currentFast) return;

    const updateNotification = async () => {
      try {
        const timeRemaining = formatTimeRemaining(currentFast);
        const isOvertime = timeRemaining.startsWith('+');
        
        if (notificationId.current) {
          await Notifications.dismissNotificationAsync(notificationId.current);
        }

        const response = await Notifications.presentNotificationAsync({
          title: isOvertime ? "🎉 Fasting Goal Exceeded!" : "🔥 Fasting in Progress",
          body: isOvertime ? 
            `Extra time: ${timeRemaining.slice(1)}` : 
            `Time remaining: ${timeRemaining}`,
          data: { fastId: currentFast.id },
        });

        notificationId.current = response;
      } catch (error) {
        console.log('Notification update error (Expo Go limitation):', error.message);
      }
    };

    // Update immediately
    await updateNotification();

    // Update every second
    intervalRef.current = setInterval(updateNotification, 1000);
  };

  const stopPersistentNotification = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (notificationId.current) {
      try {
        await Notifications.dismissNotificationAsync(notificationId.current);
        notificationId.current = null;
      } catch (error) {
        console.log('Error dismissing notification:', error.message);
      }
    }
  };

  const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    stopPersistentNotification();
  };

  return {
    scheduleNotification: async (title: string, body: string, trigger: Date) => {
      await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: { date: trigger },
      });
    },
    cancelAllNotifications,
    startPersistentNotification,
    stopPersistentNotification,
  };
};