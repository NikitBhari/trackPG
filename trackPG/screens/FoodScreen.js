import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Progress from 'react-native-progress';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';

const FoodScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nutritionData, setNutritionData] = useState(null);
  const [dailyFoodLog, setDailyFoodLog] = useState([]);
  const [dailyGoals, setDailyGoals] = useState({
    calories: 2000,
    protein: 50,
    carbs: 250,
    fat: 70,

  });
  const [todayIntake, setTodayIntake] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      loadFoodData();
      loadGoals();
    })();
  }, []);

  const loadFoodData = async () => {
    try {
      const today = new Date().toDateString();
      const savedData = await AsyncStorage.getItem(`foodLog_${today}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setDailyFoodLog(parsedData);
        
        // Calculate today's intake
        const totalIntake = parsedData.reduce((acc, food) => ({
          calories: acc.calories + food.calories,
          protein: acc.protein + food.protein,
          carbs: acc.carbs + food.carbs,
          fat: acc.fat + food.fat,
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
        
        setTodayIntake(totalIntake);
      }
    } catch (error) {
      console.error('Error loading food data:', error);
    }
  };

  const loadGoals = async () => {
    try {
      const savedGoals = await AsyncStorage.getItem('nutritionGoals');
      if (savedGoals) {
        setDailyGoals(JSON.parse(savedGoals));
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const takePicture = async () => {
    if (hasPermission === false) {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      analyzeFoodImage(result.assets[0].uri);
    }
  };

  // Mock AI analysis - In production, replace with actual API call
  const analyzeFoodImage = async (imageUri) => {
    setLoading(true);
    setNutritionData(null);
    
    // Simulate API call delay
    setTimeout(() => {
      const mockNutritionData = {
        foodName: "Grilled Chicken Salad",
        quantity: "1 serving",
        calories: 350,
        protein: 35,
        carbs: 12,
        fat: 15,
        ingredients: ["Chicken breast", "Lettuce", "Tomato", "Cucumber", "Olive oil"],
      };
      
      setNutritionData(mockNutritionData);
      setLoading(false);
    }, 2000);
  };

  const saveFoodItem = () => {
    if (!nutritionData) return;

    const today = new Date().toDateString();
    const newFoodItem = {
      id: Date.now().toString(),
      ...nutritionData,
      timestamp: new Date().toISOString(),
    };

    const updatedLog = [...dailyFoodLog, newFoodItem];
    setDailyFoodLog(updatedLog);

    // Update today's intake
    const newIntake = {
      calories: todayIntake.calories + nutritionData.calories,
      protein: todayIntake.protein + nutritionData.protein,
      carbs: todayIntake.carbs + nutritionData.carbs,
      fat: todayIntake.fat + nutritionData.fat,
    };
    setTodayIntake(newIntake);

    // Save to storage
    AsyncStorage.setItem(`foodLog_${today}`, JSON.stringify(updatedLog));
    
    Alert.alert('Success', 'Food item added to your daily log!');
    setImage(null);
    setNutritionData(null);
  };

  const deleteFoodItem = (id) => {
    const itemToDelete = dailyFoodLog.find(item => item.id === id);
    const updatedLog = dailyFoodLog.filter(item => item.id !== id);
    
    setDailyFoodLog(updatedLog);
    
    // Update intake
    const newIntake = {
      calories: todayIntake.calories - itemToDelete.calories,
      protein: todayIntake.protein - itemToDelete.protein,
      carbs: todayIntake.carbs - itemToDelete.carbs,
      fat: todayIntake.fat - itemToDelete.fat,
    };
    setTodayIntake(newIntake);
    
    const today = new Date().toDateString();
    AsyncStorage.setItem(`foodLog_${today}`, JSON.stringify(updatedLog));
  };

  const getProgressPercentage = (current, goal) => {
    return Math.min((current / goal) * 100, 100);
  };

  const NutrientProgress = ({ label, value, goal, color }) => (
    <View style={styles.nutrientContainer}>
      <View style={styles.nutrientHeader}>
        <Text style={styles.nutrientLabel}>{label}</Text>
        <Text style={styles.nutrientValue}>{value}g / {goal}g</Text>
      </View>
      <Progress.Bar
        progress={value / goal}
        width={null}
        height={8}
        color={color}
        unfilledColor="#e0e0e0"
        borderWidth={0}
        style={styles.progressBar}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Food Nutrition Tracker</Text>
        <TouchableOpacity style={styles.goalButton} onPress={takePicture}>
          <Ionicons name="flag-outline" size={20} color="#4A90E2" />
          <Text style={styles.goalButtonText}>Set Goals</Text>
        </TouchableOpacity>
      </View>

      {/* Daily Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.sectionTitle}>Today's Progress</Text>
        
        <View style={styles.calorieContainer}>
          <Text style={styles.calorieLabel}>Calories</Text>
          <Text style={styles.calorieValue}>
            {todayIntake.calories} / {dailyGoals.calories}
          </Text>
          <Progress.Circle
            progress={todayIntake.calories / dailyGoals.calories}
            size={140}
            thickness={10}
            color={todayIntake.calories > dailyGoals.calories ? '#FF5252' : '#4CAF50'}
            showsText
            formatText={() => `${Math.round((todayIntake.calories / dailyGoals.calories) * 100)}%`}
          />
        </View>

        <View style={styles.macrosContainer}>
          <NutrientProgress
            label="Protein"
            value={todayIntake.protein}
            goal={dailyGoals.protein}
            color="#4A90E2"
          />
          <NutrientProgress
            label="Carbs"
            value={todayIntake.carbs}
            goal={dailyGoals.carbs}
            color="#FFC107"
          />
          <NutrientProgress
            label="Fat"
            value={todayIntake.fat}
            goal={dailyGoals.fat}
            color="#FF5252"
          />
        </View>
      </View>

      {/* Camera Section */}
      <View style={styles.cameraSection}>
        <Text style={styles.sectionTitle}>Analyze Your Food</Text>
        
        <TouchableOpacity style={styles.cameraButton} onPress={takePicture}>
          {image ? (
            <Image source={{ uri: image }} style={styles.foodImage} />
          ) : (
            <View style={styles.cameraPlaceholder}>
              <Ionicons name="camera-outline" size={48} color="#666" />
              <Text style={styles.cameraText}>Tap to take photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Analyzing food image...</Text>
          </View>
        )}

        {nutritionData && (
          <View style={styles.nutritionResult}>
            <Text style={styles.foodName}>{nutritionData.foodName}</Text>
            <Text style={styles.foodQuantity}>Quantity: {nutritionData.quantity}</Text>
            
            <View style={styles.nutritionGrid}>
              <View style={styles.nutrientBox}>
                <Text style={styles.nutrientValueLarge}>{nutritionData.calories}</Text>
                <Text style={styles.nutrientLabelSmall}>Calories</Text>
              </View>
              <View style={styles.nutrientBox}>
                <Text style={styles.nutrientValueLarge}>{nutritionData.protein}g</Text>
                <Text style={styles.nutrientLabelSmall}>Protein</Text>
              </View>
              <View style={styles.nutrientBox}>
                <Text style={styles.nutrientValueLarge}>{nutritionData.carbs}g</Text>
                <Text style={styles.nutrientLabelSmall}>Carbs</Text>
              </View>
              <View style={styles.nutrientBox}>
                <Text style={styles.nutrientValueLarge}>{nutritionData.fat}g</Text>
                <Text style={styles.nutrientLabelSmall}>Fat</Text>
              </View>
            </View>

            <Text style={styles.ingredientsTitle}>Ingredients:</Text>
            <View style={styles.ingredientsContainer}>
              {nutritionData.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientTag}>
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={saveFoodItem}>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Add to Daily Log</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Food Log */}
      <View style={styles.logContainer}>
        <Text style={styles.sectionTitle}>Today's Food Log</Text>
        
        {dailyFoodLog.length === 0 ? (
          <View style={styles.emptyLog}>
            <Ionicons name="fast-food-outline" size={48} color="#ccc" />
            <Text style={styles.emptyLogText}>No food items logged today</Text>
          </View>
        ) : (
          dailyFoodLog.map((item) => (
            <View key={item.id} style={styles.foodLogItem}>
              <View style={styles.foodLogHeader}>
                <Text style={styles.foodLogName}>{item.foodName}</Text>
                <TouchableOpacity onPress={() => deleteFoodItem(item.id)}>
                  <Ionicons name="close-circle" size={20} color="#FF5252" />
                </TouchableOpacity>
              </View>
              <Text style={styles.foodLogQuantity}>{item.quantity}</Text>
              <View style={styles.foodLogNutrition}>
                <Text style={styles.foodLogCalories}>{item.calories} cal</Text>
                <Text style={styles.foodLogMacros}>
                  P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                </Text>
              </View>
              <Text style={styles.foodLogTime}>
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))
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
  goalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  goalButtonText: {
    marginLeft: 6,
    color: '#4A90E2',
    fontWeight: '600',
  },
  progressContainer: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  calorieContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  calorieLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  calorieValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  macrosContainer: {
    marginTop: 20,
  },
  nutrientContainer: {
    marginBottom: 16,
  },
  nutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nutrientLabel: {
    fontSize: 14,
    color: '#666',
  },
  nutrientValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  progressBar: {
    marginTop: 4,
  },
  cameraSection: {
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
  cameraButton: {
    height: 200,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  cameraPlaceholder: {
    alignItems: 'center',
  },
  cameraText: {
    marginTop: 12,
    color: '#666',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  nutritionResult: {
    backgroundColor: '#f0f7ff',
    padding: 16,
    borderRadius: 12,
  },
  foodName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  foodQuantity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  nutrientBox: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  nutrientValueLarge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  nutrientLabelSmall: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  ingredientsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  ingredientsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  ingredientTag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  ingredientText: {
    fontSize: 12,
    color: '#1976d2',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  logContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 32,
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
  foodLogItem: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  foodLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  foodLogName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  foodLogQuantity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  foodLogNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  foodLogCalories: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  foodLogMacros: {
    fontSize: 12,
    color: '#666',
  },
  foodLogTime: {
    fontSize: 12,
    color: '#999',
  },
});

export default FoodScreen;