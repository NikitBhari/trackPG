import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, G, ClipPath, Rect, Circle } from 'react-native-svg';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const GLASS_HEIGHT = 300;
const GLASS_WIDTH = width * 0.6;

const WaterScreen = () => {
  const [dailyGoal, setDailyGoal] = useState(2000); // Default goal: 2000ml
  const [currentIntake, setCurrentIntake] = useState(0);
  const [waterLog, setWaterLog] = useState([]);
  const [streak, setStreak] = useState(0);
  
  const waterLevel = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadWaterData();
    startWaveAnimation();
  }, []);

  useEffect(() => {
    // Animate water level when intake changes
    const targetLevel = Math.min(currentIntake / dailyGoal, 1);
    Animated.timing(waterLevel, {
      toValue: targetLevel,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [currentIntake, dailyGoal]);

  const startWaveAnimation = () => {
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  };

  const loadWaterData = async () => {
    try {
      const today = new Date().toDateString();
      const savedData = await AsyncStorage.getItem(`waterData_${today}`);
      const savedStreak = await AsyncStorage.getItem('waterStreak');
      const savedGoal = await AsyncStorage.getItem('waterGoal');

      if (savedGoal) {
        setDailyGoal(parseInt(savedGoal));
      }

      if (savedStreak) {
        setStreak(parseInt(savedStreak));
      }

      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setCurrentIntake(parsedData.currentIntake);
        setWaterLog(parsedData.log);
      }
    } catch (error) {
      console.error('Error loading water data:', error);
    }
  };

  const saveWaterData = async () => {
    try {
      const today = new Date().toDateString();
      const data = {
        currentIntake,
        log: waterLog,
        date: today,
      };
      await AsyncStorage.setItem(`waterData_${today}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving water data:', error);
    }
  };

  const addWater = (amount) => {
    const newIntake = currentIntake + amount;
    const newLog = [...waterLog, {
      amount,
      time: new Date().toISOString(),
    }];

    setCurrentIntake(newIntake);
    setWaterLog(newLog);
    
    // Check and update streak
    if (newIntake >= dailyGoal) {
      updateStreak();
    }

    saveWaterData();
  };

  const updateStreak = async () => {
    const today = new Date().toDateString();
    const lastAchieved = await AsyncStorage.getItem('lastWaterGoalAchieved');
    
    if (lastAchieved !== today) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      await AsyncStorage.setItem('waterStreak', newStreak.toString());
      await AsyncStorage.setItem('lastWaterGoalAchieved', today);
      
      if (newStreak > 1) {
        Alert.alert('🎉 Streak Updated!', `You're on a ${newStreak}-day streak!`);
      }
    }
  };

  const updateGoal = (newGoal) => {
    setDailyGoal(newGoal);
    AsyncStorage.setItem('waterGoal', newGoal.toString());
  };

  const resetToday = () => {
    Alert.alert(
      'Reset Water Intake',
      'Are you sure you want to reset today\'s water intake?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setCurrentIntake(0);
            setWaterLog([]);
            saveWaterData();
          },
        },
      ]
    );
  };

  const getWaterColor = () => {
    const percentage = (currentIntake / dailyGoal) * 100;
    if (percentage >= 100) return '#4CAF50'; // Green
    if (percentage >= 75) return '#2196F3'; // Blue
    if (percentage >= 50) return '#03A9F4'; // Light Blue
    if (percentage >= 25) return '#00BCD4'; // Cyan
    return '#B3E5FC'; // Very light blue
  };

  const renderWaterGlass = () => {
    const waterColor = getWaterColor();
    const waterHeight = waterLevel.interpolate({
      inputRange: [0, 1],
      outputRange: [0, GLASS_HEIGHT - 40],
    });

    const waveTranslate = waveAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -20],
    });

    return (
      <View style={styles.glassContainer}>
        {/* Glass */}
        <Svg height={GLASS_HEIGHT} width={GLASS_WIDTH}>
          {/* Glass outline */}
          <Path
            d={`M 10 10 L ${GLASS_WIDTH - 10} 10 L ${GLASS_WIDTH - 20} ${GLASS_HEIGHT - 10} L 20 ${GLASS_HEIGHT - 10} Z`}
            fill="none"
            stroke="#B0BEC5"
            strokeWidth="2"
          />
          
          {/* Water with wave animation */}
          <ClipPath id="clip">
            <Path
              d={`M 10 10 L ${GLASS_WIDTH - 10} 10 L ${GLASS_WIDTH - 20} ${GLASS_HEIGHT - 10} L 20 ${GLASS_HEIGHT - 10} Z`}
            />
          </ClipPath>
          
          <G clipPath="url(#clip)">
            <Animated.View
              style={{
                transform: [{ translateY: waterHeight }],
              }}
            >
              <Rect
                x="0"
                y="0"
                width={GLASS_WIDTH}
                height={GLASS_HEIGHT}
                fill={waterColor}
                opacity={0.6}
              />
              
              {/* Wave pattern */}
              <Animated.View
                style={{
                  transform: [{ translateY: waveTranslate }],
                }}
              >
                <Path
                  d={`M 0 20 Q ${GLASS_WIDTH * 0.25} 0 ${GLASS_WIDTH * 0.5} 20 T ${GLASS_WIDTH} 20 V 40 H 0 Z`}
                  fill={waterColor}
                  opacity={0.8}
                />
                <Path
                  d={`M 0 40 Q ${GLASS_WIDTH * 0.25} 60 ${GLASS_WIDTH * 0.5} 40 T ${GLASS_WIDTH} 40 V 60 H 0 Z`}
                  fill={waterColor}
                  opacity={0.6}
                />
              </Animated.View>
            </Animated.View>
          </G>
          
          {/* Measurement lines */}
          {[0.25, 0.5, 0.75, 1].map((level) => (
            <Path
              key={level}
              d={`M 30 ${GLASS_HEIGHT - 40 - (GLASS_HEIGHT - 80) * level} L ${GLASS_WIDTH - 30} ${GLASS_HEIGHT - 40 - (GLASS_HEIGHT - 80) * level}`}
              stroke="#90A4AE"
              strokeWidth="1"
              strokeDasharray="5,5"
            />
          ))}
        </Svg>

        {/* Water level indicator */}
        <View style={styles.waterLevelIndicator}>
          <Text style={styles.waterLevelText}>
            {currentIntake}ml / {dailyGoal}ml
          </Text>
          <Text style={styles.waterPercentage}>
            {Math.round((currentIntake / dailyGoal) * 100)}%
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Water Tracker</Text>
          <View style={styles.streakContainer}>
            <Ionicons name="flame" size={16} color="#FF9800" />
            <Text style={styles.streakText}>{streak} day streak</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={() => {}}>
          <Ionicons name="settings-outline" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {/* Main Water Glass */}
      <View style={styles.mainContent}>
        {renderWaterGlass()}
        
        {/* Goal Progress */}
        <View style={styles.goalContainer}>
          <View style={styles.goalProgress}>
            <View 
              style={[
                styles.goalFill, 
                { 
                  width: `${Math.min((currentIntake / dailyGoal) * 100, 100)}%`,
                  backgroundColor: currentIntake >= dailyGoal ? '#4CAF50' : '#4A90E2',
                }
              ]} 
            />
          </View>
          <Text style={styles.goalText}>
            {currentIntake >= dailyGoal ? '🎉 Goal Achieved!' : `${dailyGoal - currentIntake}ml to go`}
          </Text>
        </View>

        {/* Quick Add Buttons */}
        <Text style={styles.quickAddTitle}>Quick Add</Text>
        <View style={styles.quickAddContainer}>
          {[100, 250, 500, 1000].map((amount) => (
            <TouchableOpacity
              key={amount}
              style={styles.quickAddButton}
              onPress={() => addWater(amount)}
            >
              <Ionicons name="add-circle-outline" size={24} color="#4A90E2" />
              <Text style={styles.quickAddText}>{amount}ml</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Add */}
        <View style={styles.customAddContainer}>
          <Text style={styles.customAddTitle}>Custom Amount</Text>
          <View style={styles.customAddRow}>
            {[50, 150, 200].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={styles.customAddButton}
                onPress={() => addWater(amount)}
              >
                <Text style={styles.customAddText}>+{amount}ml</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Goal Settings */}
        <View style={styles.goalSettings}>
          <Text style={styles.goalSettingsTitle}>Daily Goal</Text>
          <View style={styles.goalButtons}>
            {[1500, 2000, 2500, 3000].map((goal) => (
              <TouchableOpacity
                key={goal}
                style={[
                  styles.goalButton,
                  dailyGoal === goal && styles.goalButtonActive,
                ]}
                onPress={() => updateGoal(goal)}
              >
                <Text
                  style={[
                    styles.goalButtonText,
                    dailyGoal === goal && styles.goalButtonTextActive,
                  ]}
                >
                  {goal}ml
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Water Log */}
      <View style={styles.logContainer}>
        <View style={styles.logHeader}>
          <Text style={styles.logTitle}>Today's Intake</Text>
          <TouchableOpacity onPress={resetToday}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>
        
        {waterLog.length === 0 ? (
          <View style={styles.emptyLog}>
            <Ionicons name="water-outline" size={48} color="#ccc" />
            <Text style={styles.emptyLogText}>No water logged today</Text>
          </View>
        ) : (
          <View style={styles.logList}>
            {waterLog.map((log, index) => (
              <View key={index} style={styles.logItem}>
                <View style={styles.logItemLeft}>
                  <Ionicons name="water" size={20} color="#4A90E2" />
                  <Text style={styles.logAmount}>{log.amount}ml</Text>
                </View>
                <Text style={styles.logTime}>
                  {new Date(log.time).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{waterLog.length}</Text>
            <Text style={styles.statLabel}>Drinks Today</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {waterLog.length > 0 
                ? Math.round(currentIntake / waterLog.length)
                : 0}ml
            </Text>
            <Text style={styles.statLabel}>Average per Drink</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, 
              { color: currentIntake >= dailyGoal ? '#4CAF50' : '#FF9800' }
            ]}>
              {Math.round((currentIntake / dailyGoal) * 100)}%
            </Text>
            <Text style={styles.statLabel}>Goal Progress</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  streakText: {
    marginLeft: 4,
    color: '#FF9800',
    fontWeight: '600',
  },
  settingsButton: {
    padding: 8,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  glassContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  waterLevelIndicator: {
    position: 'absolute',
    bottom: -40,
    alignItems: 'center',
  },
  waterLevelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  waterPercentage: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginTop: 4,
  },
  goalContainer: {
    width: '80%',
    marginVertical: 20,
  },
  goalProgress: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    borderRadius: 6,
  },
  goalText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quickAddTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    alignSelf: 'flex-start',
    marginLeft: 20,
  },
  quickAddContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickAddButton: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '22%',
  },
  quickAddText: {
    marginTop: 8,
    color: '#4A90E2',
    fontWeight: '600',
  },
  customAddContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  customAddTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  customAddRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  customAddButton: {
    backgroundColor: '#e3f2fd',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  customAddText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  goalSettings: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  goalSettingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  goalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  goalButtonActive: {
    backgroundColor: '#4A90E2',
  },
  goalButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  goalButtonTextActive: {
    color: '#fff',
  },
  logContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  resetText: {
    color: '#FF5252',
    fontWeight: '600',
  },
  emptyLog: {
    alignItems: 'center',
    padding: 40,
  },
  emptyLogText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
  logList: {
    maxHeight: 150,
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logAmount: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  logTime: {
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
});

export default WaterScreen;