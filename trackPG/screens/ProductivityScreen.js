import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Progress from 'react-native-progress';

const ProductivityScreen = () => {
  const [activeCategory, setActiveCategory] = useState('math');
  const [currentProblem, setCurrentProblem] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [hintUsed, setHintUsed] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));

  const categories = {
    math: {
      name: 'Math Puzzles',
      icon: 'calculator',
      color: '#4A90E2',
      problems: [
        {
          id: 1,
          question: 'If 3x + 7 = 22, what is x?',
          answer: '5',
          hint: 'Subtract 7 from both sides first',
          difficulty: 'Easy',
          points: 10,
        },
        {
          id: 2,
          question: 'What is 15% of 200?',
          answer: '30',
          hint: '15% means 15/100',
          difficulty: 'Easy',
          points: 10,
        },
        {
          id: 3,
          question: 'Solve: 2(x-3) + 4 = 12',
          answer: '7',
          hint: 'First distribute the 2',
          difficulty: 'Medium',
          points: 20,
        },
        {
          id: 4,
          question: 'If a train travels 120 km in 2 hours, what is its speed in km/h?',
          answer: '60',
          hint: 'Speed = Distance ÷ Time',
          difficulty: 'Medium',
          points: 20,
        },
        {
          id: 5,
          question: 'What is the next number: 1, 1, 2, 3, 5, 8, ?',
          answer: '13',
          hint: 'Fibonacci sequence',
          difficulty: 'Medium',
          points: 25,
        },
      ],
    },
    logic: {
      name: 'Logic Puzzles',
      icon: 'git-merge',
      color: '#FF9800',
      problems: [
        {
          id: 6,
          question: 'If all roses are flowers and some flowers fade quickly, can we say some roses fade quickly?',
          answer: 'no',
          hint: 'Think about logical sets',
          difficulty: 'Medium',
          points: 20,
        },
        {
          id: 7,
          question: 'You are in a room with two doors. One leads to freedom, one to danger. Two guards: one always lies, one always tells truth. What one question do you ask?',
          answer: 'What would the other guard say is the door to freedom?',
          hint: 'The question must work regardless of who you ask',
          difficulty: 'Hard',
          points: 30,
        },
      ],
    },
    memory: {
      name: 'Memory Games',
      icon: 'brain',
      color: '#4CAF50',
      problems: [
        {
          id: 8,
          question: 'Remember this sequence: 7, 3, 9, 2, 5',
          answer: '7,3,9,2,5',
          hint: 'Try to group the numbers',
          difficulty: 'Easy',
          points: 15,
        },
      ],
    },
    riddles: {
      name: 'Riddles',
      icon: 'help-circle',
      color: '#9C27B0',
      problems: [
        {
          id: 9,
          question: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?',
          answer: 'echo',
          hint: 'Think about sound',
          difficulty: 'Medium',
          points: 25,
        },
      ],
    },
  };

  useEffect(() => {
    loadGameData();
    generateNewProblem();
  }, []);

  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const loadGameData = async () => {
    try {
      const savedScore = await AsyncStorage.getItem('productivityScore');
      const savedStreak = await AsyncStorage.getItem('productivityStreak');
      const savedSolved = await AsyncStorage.getItem('solvedProblems');

      if (savedScore) setScore(parseInt(savedScore));
      if (savedStreak) setStreak(parseInt(savedStreak));
      if (solvedProblems) setSolvedProblems(JSON.parse(savedSolved) || []);
    } catch (error) {
      console.error('Error loading game data:', error);
    }
  };

  const saveGameData = async (newScore, newStreak) => {
    try {
      await AsyncStorage.setItem('productivityScore', newScore.toString());
      await AsyncStorage.setItem('productivityStreak', newStreak.toString());
      await AsyncStorage.setItem('solvedProblems', JSON.stringify(solvedProblems));
    } catch (error) {
      console.error('Error saving game data:', error);
    }
  };

  const generateNewProblem = () => {
    const categoryProblems = categories[activeCategory].problems;
    const unsolvedProblems = categoryProblems.filter(
      problem => !solvedProblems.includes(problem.id)
    );

    if (unsolvedProblems.length === 0) {
      // All problems solved in this category, reset or show message
      Alert.alert('Great Job!', 'You have solved all problems in this category!');
      setSolvedProblems([]);
      const randomProblem = categoryProblems[Math.floor(Math.random() * categoryProblems.length)];
      setCurrentProblem(randomProblem);
    } else {
      const randomProblem = unsolvedProblems[Math.floor(Math.random() * unsolvedProblems.length)];
      setCurrentProblem(randomProblem);
    }

    setUserAnswer('');
    setHintUsed(false);
    setTimer(0);
    setIsTimerRunning(true);

    // Animation
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const checkAnswer = () => {
    if (!currentProblem) return;

    setIsTimerRunning(false);
    
    const isCorrect = userAnswer.trim().toLowerCase() === currentProblem.answer.toLowerCase();
    const timeBonus = Math.max(0, 30 - timer);
    const basePoints = currentProblem.points;
    const streakBonus = Math.floor(streak / 3) * 5;
    const hintPenalty = hintUsed ? Math.floor(basePoints * 0.3) : 0;
    const timePenalty = timer > 60 ? Math.floor((timer - 60) / 10) * 2 : 0;
    
    let pointsEarned = basePoints + timeBonus + streakBonus - hintPenalty - timePenalty;
    pointsEarned = Math.max(5, pointsEarned); // Minimum 5 points

    if (isCorrect) {
      const newScore = score + pointsEarned;
      const newStreak = streak + 1;
      const newSolvedProblems = [...solvedProblems, currentProblem.id];

      setScore(newScore);
      setStreak(newStreak);
      setSolvedProblems(newSolvedProblems);

      saveGameData(newScore, newStreak);

      Alert.alert(
        '🎉 Correct!',
        `You earned ${pointsEarned} points!\n` +
        `Base: ${basePoints}, Time Bonus: ${timeBonus}\n` +
        `Streak Bonus: ${streakBonus}, Penalties: ${hintPenalty + timePenalty}\n\n` +
        `New Streak: ${newStreak} 🔥`,
        [
          {
            text: 'Next Problem',
            onPress: generateNewProblem,
          },
        ]
      );
    } else {
      setStreak(0);
      saveGameData(score, 0);

      Alert.alert(
        '❌ Incorrect',
        `The correct answer was: ${currentProblem.answer}\n\n` +
        `Your streak has been reset.`,
        [
          {
            text: 'Try Another',
            onPress: generateNewProblem,
          },
        ]
      );
    }
  };

  const useHint = () => {
    if (!currentProblem || hintUsed) return;

    setHintUsed(true);
    Alert.alert('💡 Hint', currentProblem.hint);
  };

  const skipProblem = () => {
    Alert.alert(
      'Skip Problem',
      'Are you sure you want to skip this problem? Your streak will be reset.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => {
            setStreak(0);
            saveGameData(score, 0);
            generateNewProblem();
          },
        },
      ]
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const CategoryButton = ({ category, name, icon, color }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        activeCategory === category && { backgroundColor: color + '20', borderColor: color },
      ]}
      onPress={() => {
        setActiveCategory(category);
        generateNewProblem();
      }}
    >
      <Icon
        name={icon}
        size={24}
        color={activeCategory === category ? color : '#666'}
      />
      <Text
        style={[
          styles.categoryButtonText,
          activeCategory === category && { color },
        ]}
      >
        {name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Brain Training</Text>
          <Text style={styles.subtitle}>Improve your thinking skills</Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Icon name="trophy" size={20} color="#FFD700" />
            <Text style={styles.statValue}>{score}</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="flame" size={20} color="#FF9800" />
            <Text style={styles.statValue}>{streak}</Text>
          </View>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        {Object.entries(categories).map(([key, cat]) => (
          <CategoryButton
            key={key}
            category={key}
            name={cat.name}
            icon={cat.icon}
            color={cat.color}
          />
        ))}
      </View>

      {/* Current Problem */}
      <Animated.View style={[styles.problemContainer, { opacity: fadeAnim }]}>
        <View style={styles.problemHeader}>
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>
              {currentProblem?.difficulty}
            </Text>
          </View>
          <View style={styles.pointsBadge}>
            <Icon name="star" size={16} color="#FFD700" />
            <Text style={styles.pointsText}>{currentProblem?.points} pts</Text>
          </View>
        </View>

        <View style={styles.timerContainer}>
          <Icon name="time-outline" size={20} color="#666" />
          <Text style={styles.timerText}>{formatTime(timer)}</Text>
          <View style={styles.progressBar}>
            <Progress.Bar
              progress={timer / 180} // 3-minute timer
              width={null}
              height={4}
              color={timer < 60 ? '#4CAF50' : timer < 120 ? '#FF9800' : '#F44336'}
              unfilledColor="#e0e0e0"
            />
          </View>
        </View>

        <Text style={styles.problemQuestion}>
          {currentProblem?.question}
        </Text>

        <TextInput
          style={styles.answerInput}
          placeholder="Enter your answer..."
          value={userAnswer}
          onChangeText={setUserAnswer}
          multiline={true}
          numberOfLines={3}
        />

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.hintButton]}
            onPress={useHint}
            disabled={hintUsed}
          >
            <Icon
              name="bulb-outline"
              size={20}
              color={hintUsed ? '#ccc' : '#FF9800'}
            />
            <Text style={[
              styles.actionButtonText,
              hintUsed && { color: '#ccc' }
            ]}>
              Hint{hintUsed ? ' (Used)' : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.submitButton]}
            onPress={checkAnswer}
            disabled={!userAnswer.trim()}
          >
            <Icon name="checkmark-circle" size={20} color="#fff" />
            <Text style={[styles.actionButtonText, { color: '#fff' }]}>
              Submit Answer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.skipButton]}
            onPress={skipProblem}
          >
            <Icon name="arrow-forward-circle" size={20} color="#666" />
            <Text style={styles.actionButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>Your Progress</Text>
        
        <View style={styles.progressGrid}>
          <View style={styles.progressItem}>
            <Text style={styles.progressValue}>
              {solvedProblems.length}
            </Text>
            <Text style={styles.progressLabel}>Problems Solved</Text>
          </View>
          
          <View style={styles.progressItem}>
            <Text style={styles.progressValue}>
              {Math.round((solvedProblems.length / 10) * 100)}%
            </Text>
            <Text style={styles.progressLabel}>Completion</Text>
          </View>
          
          <View style={styles.progressItem}>
            <Text style={styles.progressValue}>
              {score}
            </Text>
            <Text style={styles.progressLabel}>Total Score</Text>
          </View>
        </View>

        <View style={styles.categoryProgress}>
          <Text style={styles.categoryProgressTitle}>Category Progress</Text>
          {Object.entries(categories).map(([key, cat]) => {
            const solvedInCategory = solvedProblems.filter(id =>
              cat.problems.some(p => p.id === id)
            ).length;
            const totalInCategory = cat.problems.length;
            const percentage = totalInCategory > 0 
              ? Math.round((solvedInCategory / totalInCategory) * 100)
              : 0;

            return (
              <View key={key} style={styles.categoryProgressItem}>
                <View style={styles.categoryProgressHeader}>
                  <Icon name={cat.icon} size={16} color={cat.color} />
                  <Text style={styles.categoryProgressName}>{cat.name}</Text>
                  <Text style={styles.categoryProgressPercentage}>
                    {percentage}%
                  </Text>
                </View>
                <Progress.Bar
                  progress={percentage / 100}
                  width={null}
                  height={6}
                  color={cat.color}
                  unfilledColor="#e0e0e0"
                  borderWidth={0}
                />
                <Text style={styles.categoryProgressCount}>
                  {solvedInCategory} / {totalInCategory} solved
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Tips Section */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Tips for Better Thinking</Text>
        <View style={styles.tipItem}>
          <Icon name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.tipText}>Take breaks between sessions</Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.tipText}>Practice different types of problems</Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.tipText}>Try to solve without hints first</Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.tipText}>Review incorrect answers</Text>
        </View>
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
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  statValue: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    backgroundColor: '#fff',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 4,
    flex: 1,
    minWidth: '45%',
  },
  categoryButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  problemContainer: {
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
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  difficultyBadge: {
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#FF8F00',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  timerText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  progressBar: {
    flex: 2,
    marginLeft: 12,
  },
  problemQuestion: {
    fontSize: 18,
    lineHeight: 24,
    color: '#333',
    marginBottom: 20,
  },
  answerInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  hintButton: {
    backgroundColor: '#fff3e0',
    borderWidth: 1,
    borderColor: '#ffe0b2',
  },
  submitButton: {
    backgroundColor: '#4A90E2',
  },
  skipButton: {
    backgroundColor: '#f5f5f5',
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  statsSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  progressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  categoryProgress: {
    marginTop: 16,
  },
  categoryProgressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  categoryProgressItem: {
    marginBottom: 16,
  },
  categoryProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryProgressName: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  categoryProgressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryProgressCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tipsContainer: {
    backgroundColor: '#e8f5e9',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2E7D32',
    flex: 1,
  },
});

export default ProductivityScreen;