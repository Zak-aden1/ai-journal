import { useState, useCallback, useRef } from 'react';
import { ToastNotification } from '@/components/MotivationalToast';
import * as Haptics from 'expo-haptics';

interface UseToastReturn {
  notification: ToastNotification | null;
  showToast: (toast: Omit<ToastNotification, 'id'>) => void;
  showStreakToast: (streak: number) => void;
  showAchievementToast: (title: string, message: string) => void;
  showEncouragementToast: (message?: string) => void;
  showTipToast: (tip?: string) => void;
  hideToast: () => void;
  isVisible: boolean;
}

export function useToast(): UseToastReturn {
  const [notification, setNotification] = useState<ToastNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const hideToast = useCallback(() => {
    setIsVisible(false);
    // Clear notification after animation
    setTimeout(() => {
      setNotification(null);
    }, 300);
  }, []);
  
  const showToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    const newNotification: ToastNotification = {
      id: `toast-${Date.now()}`,
      duration: 4000,
      ...toast,
    };
    
    setNotification(newNotification);
    setIsVisible(true);
    
    // Auto-hide after duration
    timeoutRef.current = setTimeout(() => {
      hideToast();
    }, newNotification.duration);
  }, [hideToast]);
  
  const showStreakToast = useCallback((streak: number) => {
    const streakMessages = [
      "You're on fire! Keep the momentum going! 🔥",
      "Incredible consistency! Your future self thanks you! 🙌",
      "Building unstoppable habits, one day at a time! 💪",
      "Your dedication is paying off beautifully! ✨",
      "This streak is pure motivation fuel! ⚡"
    ];
    
    showToast({
      type: 'streak',
      title: `${streak} Day Streak! 🔥`,
      message: streakMessages[Math.floor(Math.random() * streakMessages.length)],
      emoji: '🔥',
      duration: 5000,
    });
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [showToast]);
  
  const showAchievementToast = useCallback((title: string, message: string) => {
    showToast({
      type: 'achievement',
      title,
      message,
      emoji: '🏆',
      duration: 5000,
    });
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [showToast]);
  
  const showEncouragementToast = useCallback((customMessage?: string) => {
    const encouragementMessages = [
      "Every small step counts! You're doing amazing! 🌟",
      "Progress, not perfection. Keep going! 💫",
      "Your avatars believe in you! Let's nurture them! 💚",
      "Building habits is building your future self! 🚀",
      "One habit at a time, one day at a time! 🌱",
      "You're stronger than your excuses! 💪",
      "Consistency is your superpower! ⚡",
      "Your dedication is inspiring! Keep shining! ✨"
    ];
    
    const currentHour = new Date().getHours();
    let timeBasedGreeting = '';
    
    if (currentHour >= 5 && currentHour < 12) {
      timeBasedGreeting = 'Good Morning! 🌅';
    } else if (currentHour >= 12 && currentHour < 17) {
      timeBasedGreeting = 'Afternoon Boost! ☀️';
    } else if (currentHour >= 17 && currentHour < 21) {
      timeBasedGreeting = 'Evening Motivation! 🌆';
    } else {
      timeBasedGreeting = 'Keep Going! 🌙';
    }
    
    showToast({
      type: 'encouragement',
      title: timeBasedGreeting,
      message: customMessage || encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)],
      emoji: '💙',
      duration: 4500,
    });
  }, [showToast]);
  
  const showTipToast = useCallback((customTip?: string) => {
    const tips = [
      "Start with the easiest habit to build momentum! 🎯",
      "Your avatars show their health - complete habits to boost their vitality! 🌱",
      "Consistency matters more than perfection! 🎯",
      "Try completing habits at the same time each day! ⏰",
      "Celebrate small wins - they lead to big changes! 🎉",
      "When motivation fails, let discipline carry you! 💪",
      "Progress photos and journals help track your journey! 📱",
      "Find an accountability partner for extra motivation! 🤝",
      "Stack new habits with existing ones for better success! 🔗",
      "Focus on systems, not just goals! 🎯"
    ];
    
    showToast({
      type: 'tip',
      title: 'Pro Tip! 💡',
      message: customTip || tips[Math.floor(Math.random() * tips.length)],
      emoji: '💡',
      duration: 5000,
    });
  }, [showToast]);
  
  return {
    notification,
    showToast,
    showStreakToast,
    showAchievementToast,
    showEncouragementToast,
    showTipToast,
    hideToast,
    isVisible,
  };
}