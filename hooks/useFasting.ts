import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FastingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  targetDuration: number; // in hours
  isActive: boolean;
}

export interface FastingPlan {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export const useFasting = () => {
  const [currentFast, setCurrentFast] = useState<FastingSession | null>(null);
  const [fastingHistory, setFastingHistory] = useState<FastingSession[]>([]);
  const [fastingPlan, setFastingPlan] = useState<FastingPlan>({
    monday: 16,
    tuesday: 16,
    wednesday: 16,
    thursday: 16,
    friday: 16,
    saturday: 16,
    sunday: 16,
  });

  const loadData = async () => {
    try {
      const currentFastData = await AsyncStorage.getItem('currentFast');
      const historyData = await AsyncStorage.getItem('fastingHistory');
      const planData = await AsyncStorage.getItem('fastingPlan');

      if (currentFastData) {
        const fast = JSON.parse(currentFastData);
        fast.startTime = new Date(fast.startTime);
        if (fast.endTime) fast.endTime = new Date(fast.endTime);
        setCurrentFast(fast);
      }

      if (historyData) {
        const history = JSON.parse(historyData);
        history.forEach((fast: FastingSession) => {
          fast.startTime = new Date(fast.startTime);
          if (fast.endTime) fast.endTime = new Date(fast.endTime);
        });
        setFastingHistory(history);
      }

      if (planData) {
        setFastingPlan(JSON.parse(planData));
      }
    } catch (error) {
      console.error('Error loading fasting data:', error);
    }
  };

  const saveCurrentFast = async (fast: FastingSession | null) => {
    try {
      if (fast) {
        await AsyncStorage.setItem('currentFast', JSON.stringify(fast));
      } else {
        await AsyncStorage.removeItem('currentFast');
      }
    } catch (error) {
      console.error('Error saving current fast:', error);
    }
  };

  const saveHistory = async (history: FastingSession[]) => {
    try {
      await AsyncStorage.setItem('fastingHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Error saving fasting history:', error);
    }
  };

  const startFast = (targetDuration: number) => {
    const newFast: FastingSession = {
      id: Date.now().toString(),
      startTime: new Date(),
      targetDuration,
      isActive: true,
    };
    setCurrentFast(newFast);
    saveCurrentFast(newFast);
  };

  const endFast = async (saveToHistory: boolean = true) => {
    if (currentFast) {
      if (saveToHistory) {
        const completedFast = {
          ...currentFast,
          endTime: new Date(),
          isActive: false,
        };
        
        const newHistory = [...fastingHistory, completedFast];
        setFastingHistory(newHistory);
        await saveHistory(newHistory);
      }
      
      setCurrentFast(null);
      await saveCurrentFast(null);
    }
  };

  const deleteFast = async (fastId: string) => {
    const newHistory = fastingHistory.filter(fast => fast.id !== fastId);
    setFastingHistory(newHistory);
    saveHistory(newHistory);
  };

  const updatePlan = async (newPlan: FastingPlan) => {
    setFastingPlan(newPlan);
    try {
      await AsyncStorage.setItem('fastingPlan', JSON.stringify(newPlan));
    } catch (error) {
      console.error('Error saving fasting plan:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    currentFast,
    fastingHistory,
    fastingPlan,
    startFast,
    endFast,
    updatePlan,
    deleteFast,
  };
};