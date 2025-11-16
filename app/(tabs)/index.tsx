import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Modal, TextInput, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFasting } from '@/hooks/useFasting';
import { CircularProgress } from '@/components/fasting/CircularProgress';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CustomAlert } from '@/components/ui/CustomAlert';

export default function FastingScreen() {
  const { currentFast, startFast, endFast } = useFasting();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDuration, setSelectedDuration] = useState(16);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showEndFastAlert, setShowEndFastAlert] = useState(false);
  const [customDuration, setCustomDuration] = useState('');
  const { isDarkMode } = useTheme();

  const fastingDurations = [12, 14, 16, 18, 20, 22, 24];
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Gentle pulse animation for active fasting
  useEffect(() => {
    if (currentFast) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [currentFast]);

  const calculateProgress = () => {
    if (!currentFast) return 0;
    const elapsed = currentTime.getTime() - currentFast.startTime.getTime();
    const target = currentFast.targetDuration * 60 * 60 * 1000; // Convert hours to milliseconds
    return Math.min(elapsed / target, 1);
  };

  const formatTimeRemaining = () => {
    if (!currentFast) return '16:00 H';
    
    const elapsed = currentTime.getTime() - currentFast.startTime.getTime();
    const target = currentFast.targetDuration * 60 * 60 * 1000;
    const remaining = Math.max(target - elapsed, 0);
    
    const totalMinutes = Math.floor(remaining / (60 * 1000));
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
    
    if (remaining === 0) {
      // Show elapsed time after target
      const overtime = elapsed - target;
      const overtimeTotalMinutes = Math.floor(overtime / (60 * 1000));
      const overtimeDays = Math.floor(overtimeTotalMinutes / (24 * 60));
      const overtimeHours = Math.floor((overtimeTotalMinutes % (24 * 60)) / 60);
      const overtimeMinutes = overtimeTotalMinutes % 60;
      const overtimeSeconds = Math.floor((overtime % (60 * 1000)) / 1000);
      
      if (overtimeDays > 0) {
        return `+${overtimeDays}d ${overtimeHours.toString().padStart(2, '0')}:${overtimeMinutes.toString().padStart(2, '0')}:${overtimeSeconds.toString().padStart(2, '0')}`;
      } else {
        return `+${overtimeHours.toString().padStart(2, '0')}:${overtimeMinutes.toString().padStart(2, '0')}:${overtimeSeconds.toString().padStart(2, '0')}`;
      }
    }
    
    // Format based on duration
    if (days > 0) {
      return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      weekday: 'short',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getTargetEndTime = () => {
    if (!currentFast) return new Date();
    return new Date(currentFast.startTime.getTime() + (currentFast.targetDuration * 60 * 60 * 1000));
  };

  const handleShowEndFastAlert = () => {
    setShowEndFastAlert(true);
  };

  const handleStartFast = () => {
    // Start animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      startFast(selectedDuration);
    }, 200);
  };

  const handleEndFast = () => {
    // End animation
    Animated.timing(fadeAnim, {
      toValue: 0.5,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });

    handleShowEndFastAlert();
  };

  const handleCustomDuration = () => {
    const durationInDays = parseFloat(customDuration);
    if (isNaN(durationInDays) || durationInDays <= 0) {
      Alert.alert('Invalid Duration', 'Please enter a valid duration in days.');
      return;
    }
    
    // Convert days to hours and cap at 720 hours (30 days)
    let durationInHours = durationInDays * 24;
    if (durationInHours > 720) {
      durationInHours = 720;
      Alert.alert('Duration Capped', 'Maximum duration is 30 days (720 hours). Duration has been set to 720 hours.');
    }
    
    setSelectedDuration(durationInHours);
    setShowDurationPicker(false);
    setCustomDuration('');
  };


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#ffffff' }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Fasting
        </Text>
        <TouchableOpacity>
          <IconSymbol name="bell" size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {!currentFast ? (
          <>
            {/* Pre-fasting state */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <CircularProgress progress={0}>
                <Text style={[styles.preStartLabel, { color: isDarkMode ? '#ffffff' : '#666666' }]}>
                  Fasting time
                </Text>
                <Text style={[styles.timeDisplay, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                  {selectedDuration >= 24 ? 
                    `${Math.floor(selectedDuration / 24)}d ${selectedDuration % 24}h` : 
                    `${selectedDuration}:00 H`
                  }
                </Text>
                
                <TouchableOpacity
                  style={styles.durationSelector}
                  onPress={() => setShowDurationPicker(true)}
                >
                  <Text style={[styles.durationText, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                    Change Duration
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={handleStartFast}
                >
                  <Text style={styles.startButtonText}>START</Text>
                </TouchableOpacity>
              </CircularProgress>
            </Animated.View>

            <View style={styles.timeInfo}>
              <View style={styles.timeInfoItem}>
                <Text style={[styles.timeLabel, { color: isDarkMode ? '#cccccc' : '#666666' }]}>Started</Text>
                <View style={styles.timeRow}>
                  <Text style={[styles.timeValue, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                    Fri, 12:00 PM
                  </Text>
                  <IconSymbol name="pencil" size={16} color="#666666" />
                </View>
              </View>
              
              <View style={styles.timeInfoItem}>
                <Text style={[styles.timeLabel, { color: isDarkMode ? '#cccccc' : '#666666' }]}>Goal</Text>
                <Text style={[styles.timeValue, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                  Sat, 12:00 PM
                </Text>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Active fasting state */}
            <Animated.View style={{ 
              transform: [{ scale: pulseAnim }], 
              opacity: fadeAnim 
            }}>
              <CircularProgress progress={calculateProgress()}>
                <Text style={[styles.fastingLabel, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                  Remaining time
                </Text>
                <Text style={[styles.timeDisplay, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                  {formatTimeRemaining()}
                </Text>
                <TouchableOpacity
                  style={styles.endButton}
                  onPress={handleEndFast}
                >
                  <Text style={styles.endButtonText}>END FASTING</Text>
                </TouchableOpacity>
              </CircularProgress>
            </Animated.View>

            <View style={styles.timeInfo}>
              <View style={styles.timeInfoItem}>
                <Text style={[styles.timeLabel, { color: isDarkMode ? '#cccccc' : '#666666' }]}>Started</Text>
                <View style={styles.timeRow}>
                  <Text style={[styles.timeValue, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                    {formatTime(currentFast.startTime)}
                  </Text>
                  <IconSymbol name="pencil" size={16} color="#666666" />
                </View>
              </View>
              
              <View style={styles.timeInfoItem}>
                <Text style={[styles.timeLabel, { color: isDarkMode ? '#cccccc' : '#666666' }]}>Goal</Text>
                <Text style={[styles.timeValue, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                  {formatTime(getTargetEndTime())}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Duration Picker Modal */}
      <Modal
        visible={showDurationPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDurationPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                Select Fasting Duration
              </Text>
              <TouchableOpacity onPress={() => setShowDurationPicker(false)}>
                <IconSymbol name="xmark.circle.fill" size={24} color={isDarkMode ? '#cccccc' : '#666666'} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.durationList} showsVerticalScrollIndicator={false}>
              {fastingDurations.map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.durationOption,
                    { backgroundColor: isDarkMode ? '#2a2a2a' : '#F0F0F0' },
                    selectedDuration === duration && { backgroundColor: '#FF6B35' }
                  ]}
                  onPress={() => {
                    setSelectedDuration(duration);
                    setShowDurationPicker(false);
                  }}
                >
                  <Text style={[
                    styles.durationOptionText,
                    { color: isDarkMode ? '#ffffff' : '#000000' },
                    selectedDuration === duration && { color: '#ffffff' }
                  ]}>
                    {duration} hours
                  </Text>
                  {selectedDuration === duration && (
                    <IconSymbol name="checkmark" size={20} color="#ffffff" />
                  )}
                </TouchableOpacity>
              ))}
              
              {/* Custom Duration Option */}
              <View style={[styles.customDurationContainer, { backgroundColor: isDarkMode ? '#2a2a2a' : '#F0F0F0' }]}>
                <Text style={[styles.customLabel, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                  Custom Duration (Days)
                </Text>
                <Text style={[styles.customSubLabel, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                  Maximum: 30 days (720 hours)
                </Text>
                <View style={styles.customInputContainer}>
                  <TextInput
                    style={[
                      styles.customInput,
                      { 
                        backgroundColor: isDarkMode ? '#3a3a3a' : '#ffffff',
                        color: isDarkMode ? '#ffffff' : '#000000'
                      }
                    ]}
                    value={customDuration}
                    onChangeText={setCustomDuration}
                    placeholder="Days (e.g., 1.5)"
                    placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
                    keyboardType="decimal-pad"
                  />
                  <TouchableOpacity
                    style={styles.customButton}
                    onPress={handleCustomDuration}
                  >
                    <Text style={styles.customButtonText}>Set</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom End Fast Alert */}
      <CustomAlert
        visible={showEndFastAlert}
        title="End Fasting Session"
        message="What would you like to do with your current fasting session?"
        actions={[
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setShowEndFastAlert(false),
          },
          {
            text: "End without saving",
            style: "destructive",
            onPress: () => {
              endFast(false);
              setShowEndFastAlert(false);
            },
          },
          {
            text: "Save & End",
            style: "default",
            onPress: () => {
              endFast(true);
              setShowEndFastAlert(false);
            },
          },
        ]}
        onClose={() => setShowEndFastAlert(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  preStartLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  fastingLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  timeDisplay: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  endButton: {
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
  },
  endButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 30,
    marginBottom: 20,
  },
  timeInfoItem: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  durationSelector: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  durationText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxHeight: '70%',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  durationList: {
    maxHeight: 400,
  },
  durationOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  durationOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  customDurationContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  customLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customInput: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  customButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  customButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  customSubLabel: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
});
