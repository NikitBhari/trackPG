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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';

const LearningScreen = () => {
  const [learningItem, setLearningItem] = useState('');
  const [duration, setDuration] = useState('');
  const [understanding, setUnderstanding] = useState(50);
  const [learningHistory, setLearningHistory] = useState([]);
  const [totalLearningTime, setTotalLearningTime] = useState(0);

  useEffect(() => {
    loadLearningData();
  }, []);

  const loadLearningData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('learningHistory');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setLearningHistory(parsedData);
        
        // Calculate total learning time
        const total = parsedData.reduce((sum, item) => sum + parseInt(item.duration), 0);
        setTotalLearningTime(total);
      }
    } catch (error) {
      console.error('Error loading learning data:', error);
    }
  };

  const saveLearningData = async (data) => {
    try {
      await AsyncStorage.setItem('learningHistory', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving learning data:', error);
    }
  };

  const addLearningItem = () => {
    if (!learningItem.trim() || !duration.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      topic: learningItem,
      duration: parseInt(duration),
      understanding: parseInt(understanding),
      date: new Date().toISOString(),
    };

    const updatedHistory = [newItem, ...learningHistory];
    setLearningHistory(updatedHistory);
    saveLearningData(updatedHistory);
    
    setTotalLearningTime(prev => prev + parseInt(duration));
    setLearningItem('');
    setDuration('');
    setUnderstanding(50);
  };

  const deleteLearningItem = (id) => {
    const itemToDelete = learningHistory.find(item => item.id === id);
    const updatedHistory = learningHistory.filter(item => item.id !== id);
    
    setLearningHistory(updatedHistory);
    saveLearningData(updatedHistory);
    setTotalLearningTime(prev => prev - itemToDelete.duration);
  };

  const getUnderstandingColor = (value) => {
    if (value >= 80) return '#4CAF50';
    if (value >= 60) return '#FFC107';
    if (value >= 40) return '#FF9800';
    return '#F44336';
  };

  const renderLearningItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyItemHeader}>
        <Text style={styles.historyTopic}>{item.topic}</Text>
        <TouchableOpacity onPress={() => deleteLearningItem(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#FF5252" />
        </TouchableOpacity>
      </View>
      <View style={styles.historyDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.duration} minutes</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="stats-chart-outline" size={16} color="#666" />
          <Text style={[styles.detailText, { color: getUnderstandingColor(item.understanding) }]}>
            {item.understanding}% understood
          </Text>
        </View>
      </View>
      <Text style={styles.historyDate}>
        {new Date(item.date).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Learning Tracker</Text>
        <View style={styles.totalTimeContainer}>
          <Ionicons name="time" size={24} color="#4A90E2" />
          <Text style={styles.totalTimeText}>{totalLearningTime} min total</Text>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="What did you learn today?"
          value={learningItem}
          onChangeText={setLearningItem}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Duration (minutes)"
          value={duration}
          onChangeText={setDuration}
          keyboardType="numeric"
        />
        
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>
            Understanding Level: {understanding}%
          </Text>
          <View style={styles.sliderTrack}>
            <View 
              style={[
                styles.sliderFill,
                { 
                  width: `${understanding}%`,
                  backgroundColor: getUnderstandingColor(understanding)
                }
              ]} 
            />
          </View>
          <View style={styles.sliderMarks}>
            <Text style={styles.sliderMark}>0%</Text>
            <Text style={styles.sliderMark}>50%</Text>
            <Text style={styles.sliderMark}>100%</Text>
          </View>
          <View >
          <TouchableOpacity
            style={styles.sliderButton_Add}
            onPress={() => setUnderstanding(Math.min(100, understanding + 10))}
          >
            <Ionicons name="add" size={20} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sliderButton_Sub}
            onPress={() => setUnderstanding(Math.max(0, understanding - 10))}
          >
            <Ionicons name="remove" size={20} color="#4A90E2" />
          </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={addLearningItem}>
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Learning Session</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Learning History</Text>
        {learningHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No learning sessions yet</Text>
          </View>
        ) : (
          <FlatList
            data={learningHistory}
            renderItem={renderLearningItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </View>
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
  totalTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  totalTimeText: {
    marginLeft: 6,
    color: '#4A90E2',
    fontWeight: '600',
  },
  inputContainer: {
    backgroundColor: '#fff',
    margin: 19,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#727272',
    borderColor: '#dddddd',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,

  },
  sliderContainer: {
    marginBottom: 24,
  },
  sliderLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  sliderTrack: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginBottom: 8,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 4,
  },
  sliderMarks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderMark: {
    fontSize: 12,
    color: '#666',
  },
  sliderButton_Sub: {
    position: 'absolute',
    right: 10,
    top: 40,
    backgroundColor: '#f0f7ff',
    borderRadius: 20,
    padding: 6,
    width:50,
    alignItems:"center",
    marginTop:30,
  },
  sliderButton_Add: {
    position: 'absolute',
    right: 90,
    top: 40,
    backgroundColor: '#f0f7ff',
    borderRadius: 20,
    padding: 6,
    width:50,
    alignItems:"center",
    marginTop:30,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop:30,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  historyContainer: {
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
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  historyItem: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyTopic: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
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
});

export default LearningScreen;