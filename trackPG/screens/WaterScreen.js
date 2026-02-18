import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Rect, ClipPath, Path, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Animated components from react-native-svg
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const GLASS_WIDTH = SCREEN_WIDTH * 0.6;
const GLASS_HEIGHT = GLASS_WIDTH * 1.6; // Taller glass for better visibility
const WAVE_HEIGHT = 7;

const WaterScreen = () => {
  // State
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [currentIntake, setCurrentIntake] = useState(0);
  const [waterLog, setWaterLog] = useState([]);
  const [streak, setStreak] = useState(0);
  const [glassFillPercentage, setGlassFillPercentage] = useState(0);

  // Animation values
  const waterLevel = useSharedValue(0);
  const wavePhase = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);
  const isGoalAchieved = useRef(false);

  // Load saved data on mount
  useEffect(() => {
    loadWaterData();
  }, []);

  // Animate water level when intake changes
  useEffect(() => {
    const percentage = currentIntake / dailyGoal;
    setGlassFillPercentage(Math.min(percentage, 1));
    waterLevel.value = withTiming(Math.min(percentage, 1), {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    // Check if goal just achieved
    if (currentIntake >= dailyGoal && !isGoalAchieved.current) {
      isGoalAchieved.current = true;
      triggerGoalAchieved();
    } else if (currentIntake < dailyGoal) {
      isGoalAchieved.current = false;
    }
  }, [currentIntake, dailyGoal]);

  // Continuous wave animation
  useEffect(() => {
    wavePhase.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  // Trigger goal achieved effects
  const triggerGoalAchieved = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Pulse glow
    glowOpacity.value = withSequence(
      withTiming(0.8, { duration: 300 }),
      withRepeat(
        withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
  };

  // Load data from AsyncStorage
  const loadWaterData = async () => {
    try {
      const today = new Date().toDateString();
      const savedData = await AsyncStorage.getItem(`waterData_${today}`);
      const savedStreak = await AsyncStorage.getItem('waterStreak');
      const savedGoal = await AsyncStorage.getItem('waterGoal');

      if (savedGoal) setDailyGoal(parseInt(savedGoal));
      if (savedStreak) setStreak(parseInt(savedStreak));

      if (savedData) {
        const parsed = JSON.parse(savedData);
        setCurrentIntake(parsed.currentIntake || 0);
        setWaterLog(parsed.log || []);
      }
    } catch (error) {
      console.error('Error loading water data:', error);
    }
  };

  // Save data to AsyncStorage
  const saveWaterData = async () => {
    try {
      const today = new Date().toDateString();
      const data = { currentIntake, log: waterLog, date: today };
      await AsyncStorage.setItem(`waterData_${today}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving water data:', error);
    }
  };

  // Add water intake
  const addWater = (amount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newIntake = currentIntake + amount;
    const newLog = [
      ...waterLog,
      { id: Date.now().toString(), amount, time: new Date().toISOString() },
    ];
    setCurrentIntake(newIntake);
    setWaterLog(newLog);
    saveWaterData();

    // Check streak after delay (allow state to update)
    setTimeout(() => {
      if (newIntake >= dailyGoal) {
        updateStreak();
      }
    }, 100);
  };

  // Update streak when goal is achieved for the first time today
  const updateStreak = async () => {
    const today = new Date().toDateString();
    const lastAchieved = await AsyncStorage.getItem('lastWaterGoalAchieved');
    if (lastAchieved !== today) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      await AsyncStorage.setItem('waterStreak', newStreak.toString());
      await AsyncStorage.setItem('lastWaterGoalAchieved', today);
    }
  };

  // Set new daily goal
  const setGoal = (goal) => {
    setDailyGoal(goal);
    AsyncStorage.setItem('waterGoal', goal.toString());
  };

  // Reset today's intake
  const resetToday = () => {
    Alert.alert('Reset Water Intake', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setCurrentIntake(0);
          setWaterLog([]);
          saveWaterData();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        },
      },
    ]);
  };

  // Delete a log entry
  const deleteLogEntry = (id, amount) => {
    const updatedLog = waterLog.filter((item) => item.id !== id);
    setWaterLog(updatedLog);
    setCurrentIntake((prev) => Math.max(0, prev - amount));
    saveWaterData();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Calculate average per drink
  const averagePerDrink =
    waterLog.length > 0 ? Math.round(currentIntake / waterLog.length) : 0;

  // Get color based on fill percentage
  const getWaterColor = (percentage) => {
    if (percentage >= 1) return '#4CAF50'; // Green
    if (percentage >= 0.75) return '#00BCD4'; // Cyan
    if (percentage >= 0.5) return '#2196F3'; // Blue
    if (percentage >= 0.25) return '#03A9F4'; // Light Blue
    return '#29B6F6'; // Default
  };

  // ---- Animated Props for SVG ----
  const animatedRectProps = useAnimatedProps(() => {
    const fillHeight = interpolate(
      waterLevel.value,
      [0, 1],
      [0, GLASS_HEIGHT - 40],
      Extrapolate.CLAMP
    );
    return {
      y: GLASS_HEIGHT - 20 - fillHeight, // y starts from top, so move up as fill increases
      height: fillHeight,
    };
  });

  // Generate wave path based on water level and phase
  const animatedWavePath = useAnimatedProps(() => {
    const fillHeight = interpolate(
      waterLevel.value,
      [0, 1],
      [0, GLASS_HEIGHT - 40],
      Extrapolate.CLAMP
    );
    const yBase = GLASS_HEIGHT - 20 - fillHeight;
    const phase = wavePhase.value;

    // Generate a smooth sine wave across the width of the glass
    let path = '';
    for (let x = 0; x <= GLASS_WIDTH; x += 5) {
      const waveY = Math.sin(x * 0.05 + phase) * WAVE_HEIGHT;
      if (x === 0) {
        path += `M ${x} ${yBase + waveY}`;
      } else {
        path += ` L ${x} ${yBase + waveY}`;
      }
    }
    // Close the path to fill
    path += ` L ${GLASS_WIDTH} ${GLASS_HEIGHT - 20} L 0 ${GLASS_HEIGHT - 20} Z`;
    return { d: path };
  });

  // Glow opacity for goal achieved
  const animatedGlowProps = useAnimatedProps(() => {
    return {
      opacity: glowOpacity.value,
    };
  });

  // Render a single water log item
  const renderLogItem = ({ item }) => (
    <View style={styles.logItem}>
      <View style={styles.logItemLeft}>
        <View style={styles.logIonicons}>
          <Ionicons name="water" size={16} color="#4A90E2" />
        </View>
        <View>
          <Text style={styles.logAmount}>{item.amount} ml</Text>
          <Text style={styles.logTime}>
            {new Date(item.time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => deleteLogEntry(item.id, item.amount)}
        style={styles.deleteButton}
      >
        <Ionicons name="close-circle" size={20} color="#FF5252" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Hydration</Text>
          <Text style={styles.subtitle}>Track your daily water</Text>
        </View>
        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={20} color="#FF9800" />
          <Text style={styles.streakText}>{streak} day streak</Text>
        </View>
      </View>

      {/* Futuristic Glass Card */}
      <View style={styles.glassCard}>
        {/* Outer glow when goal achieved */}
        <Animated.View style={[styles.glowOverlay, animatedGlowProps]} />

        <View style={styles.glassContainer}>
          {/* SVG Glass with animated water */}
          <Svg width={GLASS_WIDTH} height={GLASS_HEIGHT} viewBox={`0 0 ${GLASS_WIDTH} ${GLASS_HEIGHT}`}>
            <Defs>
              <LinearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                <Stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
              </LinearGradient>
              <LinearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={getWaterColor(glassFillPercentage)} stopOpacity="0.9" />
                <Stop offset="100%" stopColor={getWaterColor(glassFillPercentage)} stopOpacity="0.7" />
              </LinearGradient>
              <ClipPath id="glassClip">
                <Path
                  d={`M 20 20 L ${GLASS_WIDTH - 20} 20 L ${GLASS_WIDTH - 30} ${GLASS_HEIGHT - 20} L 30 ${GLASS_HEIGHT - 20} Z`}
                />
              </ClipPath>
            </Defs>

            {/* Glass outline */}
            <Path
              d={`M 20 20 L ${GLASS_WIDTH - 20} 20 L ${GLASS_WIDTH - 30} ${GLASS_HEIGHT - 20} L 30 ${GLASS_HEIGHT - 20} Z`}
              fill="url(#glassGradient)"
              stroke="rgba(255,255,255,0.8)"
              strokeWidth="2"
            />

            {/* Clipped water area */}
            <ClipPath id="waterClip">
              <Path
                d={`M 20 20 L ${GLASS_WIDTH - 20} 20 L ${GLASS_WIDTH - 30} ${GLASS_HEIGHT - 20} L 30 ${GLASS_HEIGHT - 20} Z`}
              />
            </ClipPath>

            {/* Water background fill (static) */}
            <AnimatedRect
              x="0"
              y={GLASS_HEIGHT - 20}
              width={GLASS_WIDTH}
              height={0}
              fill="url(#waterGradient)"
              clipPath="url(#waterClip)"
              animatedProps={animatedRectProps}
            />

            {/* Animated wave on top */}
            <AnimatedPath
              animatedProps={animatedWavePath}
              fill="url(#waterGradient)"
              clipPath="url(#waterClip)"
              opacity={0.9}
            />

            {/* Inner glass highlights */}
            <Path
              d={`M 30 30 L ${GLASS_WIDTH - 30} 30 L ${GLASS_WIDTH - 40} ${GLASS_HEIGHT - 30} L 40 ${GLASS_HEIGHT - 30} Z`}
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          </Svg>

          {/* Water percentage text */}
          <View style={styles.percentageBadge}>
            <Text style={styles.percentageText}>
              {Math.round(glassFillPercentage * 100)}%
            </Text>
          </View>
        </View>

        {/* Intake stats below glass */}
        <View style={styles.intakeStats}>
          <Text style={styles.intakeValue}>{currentIntake} ml</Text>
          <Text style={styles.intakeGoal}>of {dailyGoal} ml</Text>
        </View>

        {/* Goal progress bar */}
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(glassFillPercentage * 100, 100)}%` },
            ]}
          />
        </View>
      </View>

      {/* Quick Add Buttons - Futuristic */}
      <View style={styles.quickAddSection}>
        <Text style={styles.sectionTitle}>QUICK ADD</Text>
        <View style={styles.quickAddGrid}>
          {[100, 250, 500, 1000].map((amount) => (
            <TouchableOpacity
              key={amount}
              style={styles.quickAddButton}
              onPress={() => addWater(amount)}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={24} color="#4A90E2" />
              <Text style={styles.quickAddText}>{amount} ml</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Custom Amount Buttons */}
      <View style={styles.customAddSection}>
        <Text style={styles.sectionTitle}>CUSTOM</Text>
        <View style={styles.customAddRow}>
          {[50, 150, 200, 300].map((amount) => (
            <TouchableOpacity
              key={amount}
              style={styles.customAddButton}
              onPress={() => addWater(amount)}
            >
              <Text style={styles.customAddText}>+{amount} ml</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Goal Settings */}
      <View style={styles.goalSection}>
        <View style={styles.goalHeader}>
          <Text style={styles.sectionTitle}>DAILY GOAL</Text>
          <TouchableOpacity onPress={resetToday}>
            <Text style={styles.resetText}>Reset Today</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.goalButtons}>
          {[1500, 2000, 2500, 3000].map((goal) => (
            <TouchableOpacity
              key={goal}
              style={[
                styles.goalButton,
                dailyGoal === goal && styles.goalButtonActive,
              ]}
              onPress={() => setGoal(goal)}
            >
              <Text
                style={[
                  styles.goalButtonText,
                  dailyGoal === goal && styles.goalButtonTextActive,
                ]}
              >
                {goal} ml
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Water Log Section with Scroll */}
      <View style={styles.logSection}>
        <View style={styles.logHeader}>
          <Text style={styles.sectionTitle}>TODAY'S LOG</Text>
          <Text style={styles.logCount}>{waterLog.length} drinks</Text>
        </View>

        {waterLog.length === 0 ? (
          <View style={styles.emptyLog}>
            <Ionicons name="water-outline" size={48} color="#ccc" />
            <Text style={styles.emptyLogText}>No water logged yet</Text>
            <Text style={styles.emptyLogSubtext}>Tap a button above to add</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={waterLog}
              renderItem={renderLogItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={true}
              showsVerticalScrollIndicator={false}
              style={styles.logList}
              contentContainerStyle={styles.logListContent}
            />
            {/* Statistics */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{waterLog.length}</Text>
                <Text style={styles.statLabel}>Drinks</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{averagePerDrink} ml</Text>
                <Text style={styles.statLabel}>Avg per drink</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {Math.round(glassFillPercentage * 100)}%
                </Text>
                <Text style={styles.statLabel}>Goal</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Extra bottom padding */}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E', // Deep dark futuristic background
  },
  contentContainer: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,152,0,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.5)',
  },
  streakText: {
    marginLeft: 6,
    color: '#FF9800',
    fontWeight: '600',
  },
  glassCard: {
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(76,175,80,0.2)',
    borderRadius: 30,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  glassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  percentageBadge: {
    position: 'absolute',
    top: '40%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  percentageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  intakeStats: {
    alignItems: 'center',
    marginTop: 10,
  },
  intakeValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  intakeGoal: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 4,
  },
  quickAddSection: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    marginBottom: 12,
  },
  quickAddGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAddButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,144,226,0.1)',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(74,144,226,0.3)',
    width: '23%',
  },
  quickAddText: {
    marginTop: 8,
    color: '#4A90E2',
    fontWeight: '600',
    fontSize: 14,
  },
  customAddSection: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  customAddRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  customAddButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    width: '23%',
    alignItems: 'center',
  },
  customAddText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  goalSection: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetText: {
    color: '#FF5252',
    fontWeight: '600',
    fontSize: 14,
  },
  goalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    width: '23%',
    alignItems: 'center',
  },
  goalButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  goalButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    fontSize: 14,
  },
  goalButtonTextActive: {
    color: '#FFFFFF',
  },
  logSection: {
    marginHorizontal: 20,
    marginTop: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logCount: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  emptyLog: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyLogText: {
    marginTop: 12,
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  emptyLogSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
  logList: {
    maxHeight: 200,
  },
  logListContent: {
    paddingBottom: 8,
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  logItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logIonicons: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(74,144,226,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});

export default WaterScreen;