import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFasting } from '@/hooks/useFasting';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LineChart } from 'react-native-chart-kit';
import { CustomAlert } from '@/components/ui/CustomAlert';

const screenWidth = Dimensions.get('window').width;

export default function HistoryScreen() {
  const { fastingHistory, deleteFast } = useFasting();
  const { isDarkMode } = useTheme();
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [selectedFastEntry, setSelectedFastEntry] = useState<{id: string, date: string} | null>(null);

  const handleDeleteFast = (fastId: string, fastDate: string) => {
    setSelectedFastEntry({ id: fastId, date: fastDate });
    setShowDeleteAlert(true);
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    if (!endTime) return 'Ongoing';
    
    const duration = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(duration / (60 * 60 * 1000));
    const minutes = Math.floor((duration % (60 * 60 * 1000)) / (60 * 1000));
    
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Generate chart data for the last 7 days
  const getChartData = () => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const dayFasts = fastingHistory.filter(fast => {
        const fastDate = new Date(fast.startTime);
        return fastDate.toDateString() === date.toDateString() && fast.endTime;
      });
      
      const totalHours = dayFasts.reduce((sum, fast) => {
        if (fast.endTime) {
          const duration = fast.endTime.getTime() - fast.startTime.getTime();
          return sum + (duration / (60 * 60 * 1000));
        }
        return sum;
      }, 0);
      
      last7Days.push({
        day: date.toLocaleDateString([], { weekday: 'short' }),
        hours: totalHours
      });
    }
    
    return {
      labels: last7Days.map(d => d.day),
      datasets: [{
        data: last7Days.map(d => d.hours),
        color: (opacity = 1) => `rgba(255, 107, 53, ${opacity})`,
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
      stroke: "#FF6B35"
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#ffffff' }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            History
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#1a1a1a' : '#F8F9FA' }]}>
            <Text style={[styles.statNumber, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              {fastingHistory.filter(f => f.endTime).length}
            </Text>
            <Text style={[styles.statLabel, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
              Total Fasts
            </Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#1a1a1a' : '#F8F9FA' }]}>
            <Text style={[styles.statNumber, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              {fastingHistory.filter(f => f.endTime && 
                (f.endTime.getTime() - f.startTime.getTime()) >= (f.targetDuration * 60 * 60 * 1000)
              ).length}
            </Text>
            <Text style={[styles.statLabel, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
              Completed
            </Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#1a1a1a' : '#F8F9FA' }]}>
            <Text style={[styles.statNumber, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              {fastingHistory.length > 0 ? 
                Math.round(fastingHistory
                  .filter(f => f.endTime)
                  .reduce((sum, f) => {
                    const duration = f.endTime!.getTime() - f.startTime.getTime();
                    return sum + (duration / (60 * 60 * 1000));
                  }, 0) / fastingHistory.filter(f => f.endTime).length)
                : 0
              }h
            </Text>
            <Text style={[styles.statLabel, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
              Avg Duration
            </Text>
          </View>
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              Fasting Progress
            </Text>
            <View style={styles.timeframeSelector}>
              {['week', 'month', 'year'].map((timeframe) => (
                <TouchableOpacity
                  key={timeframe}
                  style={[
                    styles.timeframeButton,
                    selectedTimeframe === timeframe && styles.timeframeButtonActive
                  ]}
                  onPress={() => setSelectedTimeframe(timeframe)}
                >
                  <Text style={[
                    styles.timeframeText,
                    selectedTimeframe === timeframe ? styles.timeframeTextActive : 
                    { color: isDarkMode ? '#cccccc' : '#666666' }
                  ]}>
                    {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {fastingHistory.length > 0 ? (
            <View style={styles.chartContainer}>
              <LineChart
                data={getChartData()}
                width={screenWidth - 40}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </View>
          ) : (
            <View style={[styles.emptyChart, { backgroundColor: isDarkMode ? '#1a1a1a' : '#F8F9FA' }]}>
              <Text style={[styles.emptyText, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                Start your first fast to see progress charts
              </Text>
            </View>
          )}
        </View>

        {/* Fasting History List */}
        <View style={styles.historySection}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Recent Fasts
          </Text>
          
          {fastingHistory.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: isDarkMode ? '#1a1a1a' : '#F8F9FA' }]}>
              <IconSymbol name="timer" size={48} color={isDarkMode ? '#333333' : '#CCCCCC'} />
              <Text style={[styles.emptyStateTitle, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                No fasting history yet
              </Text>
              <Text style={[styles.emptyStateSubtitle, { color: isDarkMode ? '#666666' : '#999999' }]}>
                Start your first fast to track your progress
              </Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {fastingHistory
                .slice()
                .reverse()
                .slice(0, 10)
                .map((fast, index) => (
                <TouchableOpacity
                  key={fast.id}
                  style={[styles.historyItem, { backgroundColor: isDarkMode ? '#1a1a1a' : '#F8F9FA' }]}
                  onLongPress={() => handleDeleteFast(fast.id, formatDate(fast.startTime))}
                  delayLongPress={800}
                  activeOpacity={0.7}
                >
                  <View style={styles.historyItemHeader}>
                    <View style={styles.historyItemDate}>
                      <Text style={[styles.historyItemDay, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                        {formatDate(fast.startTime)}
                      </Text>
                      <Text style={[styles.historyItemDuration, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                        {formatDuration(fast.startTime, fast.endTime)}
                      </Text>
                    </View>
                    
                    <View style={styles.historyItemStatus}>
                      {fast.endTime ? (
                        <View style={[
                          styles.statusBadge,
                          { 
                            backgroundColor: fast.endTime.getTime() - fast.startTime.getTime() >= fast.targetDuration * 60 * 60 * 1000
                              ? '#4CAF50' : '#FF9800'
                          }
                        ]}>
                          <Text style={styles.statusText}>
                            {fast.endTime.getTime() - fast.startTime.getTime() >= fast.targetDuration * 60 * 60 * 1000
                              ? 'Completed' : 'Partial'}
                          </Text>
                        </View>
                      ) : (
                        <View style={[styles.statusBadge, { backgroundColor: '#2196F3' }]}>
                          <Text style={styles.statusText}>Active</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.historyItemTimes}>
                    <View style={styles.timeSlot}>
                      <Text style={[styles.timeSlotLabel, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                        Started
                      </Text>
                      <Text style={[styles.timeSlotValue, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                        {formatTime(fast.startTime)}
                      </Text>
                    </View>
                    
                    <View style={styles.timeSlot}>
                      <Text style={[styles.timeSlotLabel, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                        {fast.endTime ? 'Ended' : 'Target'}
                      </Text>
                      <Text style={[styles.timeSlotValue, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                        {fast.endTime ? 
                          formatTime(fast.endTime) : 
                          formatTime(new Date(fast.startTime.getTime() + fast.targetDuration * 60 * 60 * 1000))
                        }
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Custom Delete Fast Alert */}
      <CustomAlert
        visible={showDeleteAlert}
        title="Delete Fast"
        message={
          selectedFastEntry
            ? `Are you sure you want to delete the fast from ${selectedFastEntry.date}?`
            : ""
        }
        actions={[
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              setShowDeleteAlert(false);
              setSelectedFastEntry(null);
            },
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              if (selectedFastEntry) {
                deleteFast(selectedFastEntry.id);
              }
              setShowDeleteAlert(false);
              setSelectedFastEntry(null);
            },
          },
        ]}
        onClose={() => {
          setShowDeleteAlert(false);
          setSelectedFastEntry(null);
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 4,
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timeframeButtonActive: {
    backgroundColor: '#ffffff',
  },
  timeframeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeframeTextActive: {
    color: '#FF6B35',
  },
  chartContainer: {
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  chart: {
    borderRadius: 16,
  },
  emptyChart: {
    height: 220,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  historySection: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  historyList: {
    marginTop: 16,
  },
  historyItem: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyItemDate: {
    flex: 1,
  },
  historyItemDay: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  historyItemDuration: {
    fontSize: 14,
  },
  historyItemStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  historyItemTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeSlot: {
    flex: 1,
  },
  timeSlotLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  timeSlotValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});