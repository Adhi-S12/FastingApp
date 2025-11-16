import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { CustomAlert } from '@/components/ui/CustomAlert';

const screenWidth = Dimensions.get('window').width;

interface WeightEntry {
  id: string;
  weight: number;
  date: Date;
  unit: 'kg' | 'lbs';
}

interface UserProfile {
  name: string;
  targetWeight: number;
  weightUnit: 'kg' | 'lbs';
  fastingGoal: number; // hours per day
}

export default function ProfileScreen() {
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Your Name',
    targetWeight: 70,
    weightUnit: 'kg',
    fastingGoal: 16,
  });
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAllWeightsModal, setShowAllWeightsModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [selectedWeightEntry, setSelectedWeightEntry] = useState<{id: string, weight: number, date: Date} | null>(null);
  const [newWeight, setNewWeight] = useState('');
  const [editName, setEditName] = useState('');
  const [editTargetWeight, setEditTargetWeight] = useState('');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const profileData = await AsyncStorage.getItem('userProfile');
      const weightData = await AsyncStorage.getItem('weightHistory');
      
      if (profileData) {
        setProfile(JSON.parse(profileData));
      }
      
      if (weightData) {
        const weights = JSON.parse(weightData);
        weights.forEach((weight: WeightEntry) => {
          weight.date = new Date(weight.date);
        });
        setWeightHistory(weights);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const saveProfile = async (newProfile: UserProfile) => {
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(newProfile));
      setProfile(newProfile);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const saveWeightHistory = async (weights: WeightEntry[]) => {
    try {
      await AsyncStorage.setItem('weightHistory', JSON.stringify(weights));
      setWeightHistory(weights);
    } catch (error) {
      console.error('Error saving weight history:', error);
    }
  };

  const addWeightEntry = () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight value.');
      return;
    }

    const newEntry: WeightEntry = {
      id: Date.now().toString(),
      weight,
      date: new Date(),
      unit: profile.weightUnit,
    };

    const newWeights = [newEntry, ...weightHistory].sort((a, b) => b.date.getTime() - a.date.getTime());
    saveWeightHistory(newWeights);
    setNewWeight('');
    setShowWeightModal(false);
  };

  const handleDeleteWeight = (entryId: string, weight: number, date: Date) => {
    setSelectedWeightEntry({ id: entryId, weight, date });
    setShowDeleteAlert(true);
  };

  const deleteWeightEntry = async (entryId: string) => {
    const newWeights = weightHistory.filter(entry => entry.id !== entryId);
    saveWeightHistory(newWeights);
  };

  const updateProfile = () => {
    const updatedProfile = {
      ...profile,
      name: editName.trim() || profile.name,
      targetWeight: parseFloat(editTargetWeight) || profile.targetWeight,
    };
    saveProfile(updatedProfile);
    setShowProfileModal(false);
    setEditName('');
    setEditTargetWeight('');
  };

  const getWeightDifference = () => {
    const currentWeight = getCurrentWeight();
    if (currentWeight === 0) return 0;
    return currentWeight - profile.targetWeight;
  };

  const predictTimeToTarget = () => {
    if (weightHistory.length < 2) return null;
    
    const currentWeight = getCurrentWeight();
    const weightDifference = Math.abs(getWeightDifference());
    
    if (weightDifference === 0) return 0;
    
    // Calculate average weight loss per week from last 4 entries
    const recentEntries = weightHistory.slice(0, 4).reverse();
    if (recentEntries.length < 2) return null;
    
    let totalWeightChange = 0;
    let totalDays = 0;
    
    for (let i = 1; i < recentEntries.length; i++) {
      const weightChange = recentEntries[i-1].weight - recentEntries[i].weight;
      const daysDiff = (recentEntries[i].date.getTime() - recentEntries[i-1].date.getTime()) / (1000 * 60 * 60 * 24);
      
      totalWeightChange += weightChange;
      totalDays += daysDiff;
    }
    
    if (totalDays === 0) return null;
    
    const avgWeightLossPerDay = totalWeightChange / totalDays;
    if (avgWeightLossPerDay <= 0) return null; // No weight loss trend
    
    const daysToTarget = weightDifference / avgWeightLossPerDay;
    return Math.round(daysToTarget);
  };

  const getProgressChartData = () => {
    if (weightHistory.length === 0) return null;
    
    const currentWeight = getCurrentWeight();
    const difference = getWeightDifference();
    
    return {
      labels: ['Current', 'Target'],
      datasets: [{
        data: [currentWeight, profile.targetWeight],
        colors: [
          (opacity = 1) => difference > 0 ? `rgba(255, 152, 0, ${opacity})` : `rgba(76, 175, 80, ${opacity})`,
          (opacity = 1) => `rgba(255, 107, 53, ${opacity})`
        ]
      }]
    };
  };

  const getWeightChartData = () => {
    const last30Days = weightHistory
      .slice(0, 10)
      .reverse();

    if (last30Days.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }]
      };
    }

    return {
      labels: last30Days.map(entry => 
        entry.date.toLocaleDateString([], { month: 'short', day: 'numeric' })
      ),
      datasets: [{
        data: last30Days.map(entry => entry.weight),
        color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
        strokeWidth: 3
      }]
    };
  };

  const chartConfig = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
    backgroundGradientFrom: isDarkMode ? '#1a1a1a' : '#ffffff',
    backgroundGradientTo: isDarkMode ? '#1a1a1a' : '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#4BC0C0"
    }
  };

  const getCurrentWeight = () => {
    return weightHistory.length > 0 ? weightHistory[0].weight : 0;
  };

  const getWeightProgress = () => {
    if (weightHistory.length < 2) return 0;
    const latest = weightHistory[0].weight;
    const previous = weightHistory[1].weight;
    return latest - previous;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#ffffff' }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Profile
          </Text>
          <TouchableOpacity>
            <IconSymbol name="gearshape.fill" size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={[styles.profileCard, { backgroundColor: isDarkMode ? '#1a1a1a' : '#F8F9FA' }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: '#FF6B35' }]}>
              <Text style={styles.avatarText}>
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              {profile.name || 'Your Name'}
            </Text>
            <Text style={[styles.profileGoal, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
              Daily Goal: {profile.fastingGoal}h fasting
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => {
              setEditName(profile.name);
              setEditTargetWeight(profile.targetWeight.toString());
              setShowProfileModal(true);
            }}
          >
            <IconSymbol name="pencil" size={16} color="#FF6B35" />
          </TouchableOpacity>
        </View>

        {/* Current Weight Quick Add */}
        <View style={styles.quickWeightSection}>
          <View style={styles.quickWeightHeader}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              Current Weight
            </Text>
            <TouchableOpacity 
              style={styles.quickAddButton}
              onPress={() => setShowWeightModal(true)}
            >
              <Text style={styles.quickAddText}>Log Weight</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.currentWeightCard, { backgroundColor: isDarkMode ? '#1a1a1a' : '#F8F9FA' }]}>
            <View style={styles.currentWeightContent}>
              <Text style={[styles.currentWeightValue, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                {getCurrentWeight() > 0 ? getCurrentWeight().toFixed(1) : '--'}
              </Text>
              <Text style={[styles.currentWeightUnit, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                {profile.weightUnit}
              </Text>
            </View>
            <Text style={[styles.currentWeightLabel, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
              {weightHistory.length > 0 
                ? `Last updated: ${weightHistory[0].date.toLocaleDateString()}`
                : 'No weight recorded'
              }
            </Text>
          </View>
        </View>

        {/* Weight Tracking */}
        <View style={styles.weightSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              Weight Tracking
            </Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowWeightModal(true)}
            >
              <IconSymbol name="plus.circle.fill" size={24} color="#FF6B35" />
            </TouchableOpacity>
          </View>

          {/* Current Weight Stats */}
          <View style={styles.weightStatsContainer}>
            <View style={[styles.weightStatCard, { backgroundColor: isDarkMode ? '#1a1a1a' : '#F8F9FA' }]}>
              <Text style={[styles.weightStatNumber, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                {getCurrentWeight().toFixed(1)}
              </Text>
              <Text style={[styles.weightStatUnit, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                {profile.weightUnit}
              </Text>
              <Text style={[styles.weightStatLabel, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                Current Weight
              </Text>
            </View>
            
            <View style={[styles.weightStatCard, { backgroundColor: isDarkMode ? '#1a1a1a' : '#F8F9FA' }]}>
              <Text style={[styles.weightStatNumber, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                {profile.targetWeight.toFixed(1)}
              </Text>
              <Text style={[styles.weightStatUnit, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                {profile.weightUnit}
              </Text>
              <Text style={[styles.weightStatLabel, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                Target Weight
              </Text>
            </View>
            
            <View style={[styles.weightStatCard, { backgroundColor: isDarkMode ? '#1a1a1a' : '#F8F9FA' }]}>
              <Text style={[
                styles.weightStatNumber, 
                { 
                  color: getWeightDifference() > 0 ? '#FF9800' : getWeightDifference() < 0 ? '#4CAF50' : (isDarkMode ? '#ffffff' : '#000000')
                }
              ]}>
                {Math.abs(getWeightDifference()).toFixed(1)}
              </Text>
              <Text style={[styles.weightStatUnit, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                {profile.weightUnit}
              </Text>
              <Text style={[styles.weightStatLabel, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                to Lose
              </Text>
            </View>
          </View>

          {/* Weight Difference & Prediction */}
          {weightHistory.length > 0 && (
            <View style={[styles.predictionCard, { backgroundColor: isDarkMode ? '#1a1a1a' : '#F8F9FA' }]}>
              <Text style={[styles.predictionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                Progress Insights
              </Text>
              
              <View style={styles.predictionRow}>
                <View style={styles.predictionItem}>
                  <Text style={[styles.predictionLabel, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                    Weight to lose
                  </Text>
                  <Text style={[
                    styles.predictionValue,
                    { color: getWeightDifference() > 0 ? '#FF9800' : '#4CAF50' }
                  ]}>
                    {getWeightDifference() > 0 ? 
                      `${Math.abs(getWeightDifference()).toFixed(1)} ${profile.weightUnit}` :
                      'Target reached!'
                    }
                  </Text>
                </View>
              </View>

              {predictTimeToTarget() !== null && (
                <View style={styles.predictionRow}>
                  <View style={styles.predictionItem}>
                    <Text style={[styles.predictionLabel, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                      Estimated time to target
                    </Text>
                    <Text style={[styles.predictionValue, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                      {predictTimeToTarget() === 0 ? 'Target reached!' : 
                       predictTimeToTarget() === 1 ? '1 day' :
                       predictTimeToTarget()! < 30 ? `${predictTimeToTarget()} days` :
                       predictTimeToTarget()! < 365 ? `${Math.round(predictTimeToTarget()! / 7)} weeks` :
                       `${Math.round(predictTimeToTarget()! / 365)} years`}
                    </Text>
                  </View>
                </View>
              )}

              {predictTimeToTarget() === null && weightHistory.length >= 2 && (
                <View style={styles.predictionRow}>
                  <Text style={[styles.predictionNote, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                    Add more weight entries to see time prediction
                  </Text>
                </View>
              )}
            </View>
          )}


          {/* Weight Chart */}
          {weightHistory.length > 0 ? (
            <View style={styles.chartContainer}>
              <Text style={[styles.chartTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                Weight Progress
              </Text>
              <LineChart
                data={getWeightChartData()}
                width={screenWidth - 40}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </View>
          ) : (
            <View style={[styles.emptyChart, { backgroundColor: isDarkMode ? '#1a1a1a' : '#F8F9FA' }]}>
              <IconSymbol name="scalemass" size={48} color={isDarkMode ? '#333333' : '#CCCCCC'} />
              <Text style={[styles.emptyText, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                No weight data yet
              </Text>
              <Text style={[styles.emptySubtext, { color: isDarkMode ? '#666666' : '#999999' }]}>
                Add your weight to track progress
              </Text>
            </View>
          )}
        </View>

        {/* Recent Weight Entries */}
        {weightHistory.length > 0 && (
          <View style={styles.recentWeightsSection}>
            <View style={styles.recentWeightsHeader}>
              <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                Recent Entries
              </Text>
              {weightHistory.length > 5 && (
                <TouchableOpacity 
                  style={styles.moreButton}
                  onPress={() => setShowAllWeightsModal(true)}
                >
                  <Text style={styles.moreButtonText}>More</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.weightEntriesList}>
              {weightHistory.slice(0, 5).map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  style={[styles.weightEntry, { backgroundColor: isDarkMode ? '#1a1a1a' : '#F8F9FA' }]}
                  onLongPress={() => handleDeleteWeight(entry.id, entry.weight, entry.date)}
                  delayLongPress={800}
                  activeOpacity={0.7}
                >
                  <View style={styles.weightEntryInfo}>
                    <Text style={[styles.weightEntryWeight, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                      {entry.weight.toFixed(1)} {entry.unit}
                    </Text>
                    <Text style={[styles.weightEntryDate, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                      {entry.date.toLocaleDateString([], { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.deleteWeightButton}
                    onPress={() => handleDeleteWeight(entry.id, entry.weight, entry.date)}
                  >
                    <IconSymbol name="trash" size={16} color="#FF6B6B" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Settings */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Settings
          </Text>
          
          <View style={styles.settingsList}>
            <TouchableOpacity 
              style={[styles.settingItem, { backgroundColor: isDarkMode ? '#1a1a1a' : '#F8F9FA' }]}
              onPress={() => {
                setEditName(profile.name);
                setEditTargetWeight(profile.targetWeight.toString());
                setShowProfileModal(true);
              }}
            >
              <IconSymbol name="person.circle" size={24} color="#FF6B35" />
              <Text style={[styles.settingText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                Edit Profile
              </Text>
              <IconSymbol name="chevron.right" size={16} color={isDarkMode ? '#cccccc' : '#666666'} />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.settingItem, { backgroundColor: isDarkMode ? '#1a1a1a' : '#F8F9FA' }]}>
              <IconSymbol name="bell" size={24} color="#FF6B35" />
              <Text style={[styles.settingText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                Notifications
              </Text>
              <IconSymbol name="chevron.right" size={16} color={isDarkMode ? '#cccccc' : '#666666'} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.settingItem, { backgroundColor: isDarkMode ? '#1a1a1a' : '#F8F9FA' }]}
              onPress={toggleTheme}
            >
              <IconSymbol name="moon" size={24} color="#FF6B35" />
              <Text style={[styles.settingText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                Dark Mode
              </Text>
              <Text style={[styles.settingValue, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                {isDarkMode ? 'On' : 'Off'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Add Weight Modal */}
      <Modal
        visible={showWeightModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWeightModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                Add Weight Entry
              </Text>
              <TouchableOpacity onPress={() => setShowWeightModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={24} color={isDarkMode ? '#cccccc' : '#666666'} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={[styles.inputLabel, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                Weight ({profile.weightUnit})
              </Text>
              <TextInput
                style={[
                  styles.weightInput, 
                  { 
                    backgroundColor: isDarkMode ? '#2a2a2a' : '#F0F0F0',
                    color: isDarkMode ? '#ffffff' : '#000000'
                  }
                ]}
                value={newWeight}
                onChangeText={setNewWeight}
                placeholder={`Enter weight in ${profile.weightUnit}`}
                placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
                keyboardType="decimal-pad"
                autoFocus
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowWeightModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={addWeightEntry}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Edit Modal */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                Edit Profile
              </Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={24} color={isDarkMode ? '#cccccc' : '#666666'} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={[styles.inputLabel, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                Name
              </Text>
              <TextInput
                style={[
                  styles.weightInput, 
                  { 
                    backgroundColor: isDarkMode ? '#2a2a2a' : '#F0F0F0',
                    color: isDarkMode ? '#ffffff' : '#000000'
                  }
                ]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
                autoFocus
              />

              <Text style={[styles.inputLabel, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                Target Weight ({profile.weightUnit})
              </Text>
              <TextInput
                style={[
                  styles.weightInput, 
                  { 
                    backgroundColor: isDarkMode ? '#2a2a2a' : '#F0F0F0',
                    color: isDarkMode ? '#ffffff' : '#000000'
                  }
                ]}
                value={editTargetWeight}
                onChangeText={setEditTargetWeight}
                placeholder={`Enter target weight in ${profile.weightUnit}`}
                placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
                keyboardType="decimal-pad"
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowProfileModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={updateProfile}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* All Weight Entries Modal */}
      <Modal
        visible={showAllWeightsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAllWeightsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.fullModalContainer, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                All Weight Entries
              </Text>
              <TouchableOpacity onPress={() => setShowAllWeightsModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={24} color={isDarkMode ? '#cccccc' : '#666666'} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.allWeightsScroll} showsVerticalScrollIndicator={false}>
              {weightHistory.map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  style={[styles.fullWeightEntry, { backgroundColor: isDarkMode ? '#2a2a2a' : '#F8F9FA' }]}
                  onLongPress={() => {
                    handleDeleteWeight(entry.id, entry.weight, entry.date);
                    if (weightHistory.length <= 6) {
                      setShowAllWeightsModal(false);
                    }
                  }}
                  delayLongPress={800}
                  activeOpacity={0.7}
                >
                  <View style={styles.fullWeightEntryInfo}>
                    <Text style={[styles.fullWeightEntryWeight, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                      {entry.weight.toFixed(1)} {entry.unit}
                    </Text>
                    <Text style={[styles.fullWeightEntryDate, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                      {entry.date.toLocaleDateString([], { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.deleteFullWeightButton}
                    onPress={() => {
                      handleDeleteWeight(entry.id, entry.weight, entry.date);
                      if (weightHistory.length <= 6) {
                        setShowAllWeightsModal(false);
                      }
                    }}
                  >
                    <IconSymbol name="trash" size={18} color="#FF6B6B" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              
              {weightHistory.length === 0 && (
                <View style={styles.emptyAllWeights}>
                  <Text style={[styles.emptyAllWeightsText, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                    No weight entries found
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Delete Weight Alert */}
      <CustomAlert
        visible={showDeleteAlert}
        title="Delete Weight Entry"
        message={
          selectedWeightEntry
            ? `Are you sure you want to delete the weight entry of ${selectedWeightEntry.weight.toFixed(1)} ${profile.weightUnit} from ${selectedWeightEntry.date.toLocaleDateString()}?`
            : ""
        }
        actions={[
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              setShowDeleteAlert(false);
              setSelectedWeightEntry(null);
            },
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              if (selectedWeightEntry) {
                deleteWeightEntry(selectedWeightEntry.id);
              }
              setShowDeleteAlert(false);
              setSelectedWeightEntry(null);
            },
          },
        ]}
        onClose={() => {
          setShowDeleteAlert(false);
          setSelectedWeightEntry(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
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
  profileCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileGoal: {
    fontSize: 14,
  },
  editButton: {
    padding: 8,
  },
  weightSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 4,
  },
  weightStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  weightStatCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  weightStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  weightStatUnit: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  weightStatLabel: {
    fontSize: 12,
  },
  chartContainer: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 16,
  },
  emptyChart: {
    height: 220,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
  },
  recentWeightsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  weightEntriesList: {
    marginTop: 16,
  },
  weightEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  weightEntryInfo: {},
  weightEntryWeight: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  weightEntryDate: {
    fontSize: 14,
  },
  settingsSection: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  settingsList: {
    marginTop: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  settingValue: {
    fontSize: 14,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth - 40,
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
  modalContent: {},
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  weightInput: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#FF6B35',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteWeightButton: {
    padding: 4,
  },
  predictionCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  predictionRow: {
    marginBottom: 8,
  },
  predictionItem: {
    marginBottom: 4,
  },
  predictionLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  predictionValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  predictionNote: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 8,
  },
  progressChartContainer: {
    marginBottom: 20,
  },
  quickWeightSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickWeightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickAddButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickAddText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  currentWeightCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  currentWeightContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  currentWeightValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginRight: 8,
  },
  currentWeightUnit: {
    fontSize: 18,
    fontWeight: '500',
  },
  currentWeightLabel: {
    fontSize: 14,
  },
  recentWeightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  moreButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  moreButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  fullModalContainer: {
    width: '95%',
    height: '80%',
    borderRadius: 20,
    padding: 20,
  },
  allWeightsScroll: {
    flex: 1,
    marginTop: 10,
  },
  fullWeightEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  fullWeightEntryInfo: {
    flex: 1,
  },
  fullWeightEntryWeight: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  fullWeightEntryDate: {
    fontSize: 14,
  },
  deleteFullWeightButton: {
    padding: 8,
    marginLeft: 12,
  },
  emptyAllWeights: {
    padding: 40,
    alignItems: 'center',
  },
  emptyAllWeightsText: {
    fontSize: 16,
    textAlign: 'center',
  },
});