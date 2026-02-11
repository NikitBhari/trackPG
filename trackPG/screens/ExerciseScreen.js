import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

const ExerciseScreen = () => {
  const [exerciseName, setExerciseName] = useState('');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [todayCalories, setTodayCalories] = useState(0);
  const [showExercisesModal, setShowExercisesModal] = useState(false);
  
  const commonExercises = [
    { name: 'Running', caloriesPerMin: 10, scoreMultiplier: 1.2 },
    { name: 'Cycling', caloriesPerMin: 8, scoreMultiplier: 1.1 },
    { name: 'Swimming', caloriesPerMin: 12, scoreMultiplier: 1.5 },
    { name: 'Weight Training', caloriesPerMin: 7, scoreMultiplier: 1.3 },
    { name: 'Yoga', caloriesPerMin: 4, scoreMultiplier: 0.8 },
    { name: 'Walking', caloriesPerMin: 5, scoreMultiplier: 0.9 },
    { name: 'HIIT', caloriesPerMin: 14, scoreMultiplier: 1.8 },
    { name: 'Dancing', caloriesPerMin: 7, scoreMultiplier: 1.0 },
  ];

  useEffect(() => {
    loadExerciseData();
  }, []);

  const loadExerciseData = async () => {
    try {
      const today = new Date().toDateString();
      const savedData = await AsyncStorage.getItem(`exerciseData_${today}`);
      const savedTotalScore = await AsyncStorage.getItem('totalExerciseScore');

      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setExerciseHistory(parsedData.history);
        setTodayCalories(parsedData.todayCalories);
      }

      if (savedTotalScore) {
        setTotalScore(parseInt(savedTotalScore));
      }
    } catch (error) {
      console.error('Error loading exercise data:', error);
    }
  };

  const saveExerciseData = async (history, calories) => {
    try {
      const today = new Date().toDateString();
      const data = {
        history,
        todayCalories: calories,
        date: today,
      };
      await AsyncStorage.setItem(`exerciseData_${today}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving exercise data:', error);
    }
  };

  const calculateExerciseScore = (exercise, duration, intensity) => {
    const baseCalories = exercise.caloriesPerMin * duration;
    const intensityBonus = baseCalories * (intensity / 10);
    const caloriesBurnt = baseCalories + intensityBonus;
    const score = Math.round(caloriesBurnt * exercise.scoreMultiplier);
    return { caloriesBurnt, score };
  };

  const addExercise = () => {
    if (!exerciseName.trim() || !duration.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const durationNum = parseInt(duration);
    if (durationNum <= 0) {
      Alert.alert('Error', 'Duration must be greater than 0');
      return;
    }

    const selectedExercise = commonExercises.find(
      ex => ex.name.toLowerCase() === exerciseName.toLowerCase()
    ) || { 
      name: exerciseName, 
      caloriesPerMin: 6, 
      scoreMultiplier: 1.0 
    };

    const { caloriesBurnt, score } = calculateExerciseScore(
      selectedExercise,
      durationNum,
      intensity
    );

    const newExercise = {
      id: Date.now().toString(),
      name: selectedExercise.name,
      duration: durationNum,
      intensity: intensity,
      caloriesBurnt: Math.round(caloriesBurnt),
      score: score,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [newExercise, ...exerciseHistory];
    const updatedCalories = todayCalories + Math.round(caloriesBurnt);
    const updatedTotalScore = totalScore + score;

    setExerciseHistory(updatedHistory);
    setTodayCalories(updatedCalories);
    setTotalScore(updatedTotalScore);
    
    saveExerciseData(updatedHistory, updatedCalories);
    AsyncStorage.setItem('totalExerciseScore', updatedTotalScore.toString());

    setExerciseName('');
    setDuration('');
    setIntensity(5);
  };

  const selectExercise = (exercise) => {
    setExerciseName(exercise.name);
    setShowExercisesModal(false);
  };

  const deleteExercise = (id) => {
    const exerciseToDelete = exerciseHistory.find(item => item.id === id);
    const updatedHistory = exerciseHistory.filter(item => item.id !== id);
    
    setExerciseHistory(updatedHistory);
    setTodayCalories(prev => prev - exerciseToDelete.caloriesBurnt);
    setTotalScore(prev => prev - exerciseToDelete.score);
    
    saveExerciseData(updatedHistory, todayCalories - exerciseToDelete.caloriesBurnt);
    AsyncStorage.setItem('totalExerciseScore', (totalScore - exerciseToDelete.score).toString());
  };

  const getIntensityColor = (value) => {
    if (value >= 8) return '#F44336';
    if (value >= 5) return '#FF9800';
    return '#4CAF50';
  };

  const getIntensityLabel = (value) => {
    if (value >= 8) return 'High';
    if (value >= 5) return 'Medium';
    return 'Low';
  };

  const renderExerciseItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyItemHeader}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{item.name}</Text>
          <View style={styles.exerciseDetails}>
            <View style={styles.detailBadge}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{item.duration} min</Text>
            </View>
            <View style={[styles.detailBadge, { backgroundColor: getIntensityColor(item.intensity) + '20' }]}>
              <Ionicons name="speedometer-outline" size={14} color={getIntensityColor(item.intensity)} />
              <Text style={[styles.detailText, { color: getIntensityColor(item.intensity) }]}>
                {getIntensityLabel(item.intensity)}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => deleteExercise(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#FF5252" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Ionicons name="flame" size={20} color="#FF9800" />
          <Text style={styles.statValue}>{item.caloriesBurnt}</Text>
          <Text style={styles.statLabel}>Calories</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="trophy" size={20} color="#FFD700" />
          <Text style={styles.statValue}>{item.score}</Text>
          <Text style={styles.statLabel}>Score</Text>
        </View>
      </View>
      
      <Text style={styles.exerciseTime}>
        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header with Stats */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Exercise Tracker</Text>
          <View style={styles.statsRow}>
            <View style={styles.statHeader}>
              <Ionicons name="flame-outline" size={16} color="#FF9800" />
              <Text style={styles.statHeaderText}>{todayCalories} cal</Text>
            </View>
            <View style={styles.statHeader}>
              <Ionicons name="trophy-outline" size={16} color="#FFD700" />
              <Text style={styles.statHeaderText}>{totalScore} pts</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.leaderboardButton}>
          <Ionicons name="podium" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {/* Add Exercise Form */}
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Log New Exercise</Text>
        
        <TouchableOpacity 
          style={styles.exerciseInput}
          onPress={() => setShowExercisesModal(true)}
        >
          <Text style={exerciseName ? styles.inputText : styles.placeholderText}>
            {exerciseName || 'Select or type exercise'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder="Duration (minutes)"
          value={duration}
          onChangeText={setDuration}
          keyboardType="numeric"
        />
        
        {/* Intensity Slider */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>Intensity Level</Text>
            <View style={[styles.intensityBadge, { backgroundColor: getIntensityColor(intensity) + '20' }]}>
              <Text style={[styles.intensityText, { color: getIntensityColor(intensity) }]}>
                {getIntensityLabel(intensity)} ({intensity}/10)
              </Text>
            </View>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={intensity}
            onValueChange={setIntensity}
            minimumTrackTintColor={getIntensityColor(intensity)}
            maximumTrackTintColor="#e0e0e0"
            thumbTintColor={getIntensityColor(intensity)}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>Light</Text>
            <Text style={styles.sliderLabelText}>Moderate</Text>
            <Text style={styles.sliderLabelText}>Intense</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={addExercise}>
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Exercise</Text>
        </TouchableOpacity>
      </View>

      {/* Common Exercises */}
      <View style={styles.commonExercisesContainer}>
        <Text style={styles.sectionTitle}>Common Exercises</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {commonExercises.map((exercise, index) => (
            <TouchableOpacity
              key={index}
              style={styles.commonExerciseCard}
              onPress={() => selectExercise(exercise)}
            >
              <View style={styles.exerciseIoniconsContainer}>
                <Ionicons 
                  name={exercise.name === 'Yoga' ? 'body' : 'barbell'} 
                  size={24} 
                  color="#4A90E2" 
                />
              </View>
              <Text style={styles.commonExerciseName}>{exercise.name}</Text>
              <Text style={styles.commonExerciseCalories}>
                {exercise.caloriesPerMin} cal/min
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Today's Exercises */}
      <View style={styles.historyContainer}>
        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Today's Exercises</Text>
          <Text style={styles.historyCount}>{exerciseHistory.length} activities</Text>
        </View>
        
        {exerciseHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No exercises logged today</Text>
            <Text style={styles.emptyStateSubtext}>Get moving to earn points!</Text>
          </View>
        ) : (
          <FlatList
            data={exerciseHistory}
            renderItem={renderExerciseItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Progress Summary */}
      <View style={styles.progressContainer}>
        <Text style={styles.sectionTitle}>Weekly Progress</Text>
        <View style={styles.progressBars}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
            <View key={day} style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { height: `${Math.random() * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressBarLabel}>{day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Exercises Modal */}
      <Modal
        visible={showExercisesModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Exercise</Text>
              <TouchableOpacity onPress={() => setShowExercisesModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={commonExercises}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => selectExercise(item)}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  <Text style={styles.modalItemSubtext}>
                    {item.caloriesPerMin} cal/min • Score: {item.scoreMultiplier}x
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => index.toString()}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  statsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  statHeaderText: {
    marginLeft: 6,
    color: '#666',
    fontWeight: '600',
  },
  leaderboardButton: {
    padding: 8,
  },
  formContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  exerciseInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  sliderContainer: {
    marginBottom: 24,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 16,
    color: '#333',
  },
  intensityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  intensityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  slider: {
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#666',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  commonExercisesContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  commonExerciseCard: {
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    width: 100,
  },
  exerciseIoniconsContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#f0f7ff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  commonExerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  commonExerciseCalories: {
    fontSize: 12,
    color: '#666',
  },
  historyContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyCount: {
    fontSize: 14,
    color: '#666',
  },
  historyItem: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  exerciseDetails: {
    flexDirection: 'row',
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  exerciseTime: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
  },
  progressContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
  },
  progressBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  progressBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  progressBarBackground: {
    width: 20,
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  progressBarFill: {
    backgroundColor: '#4A90E2',
    width: '100%',
    borderRadius: 10,
  },
  progressBarLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  modalItemSubtext: {
    fontSize: 12,
    color: '#666',
  },
});

export default ExerciseScreen;