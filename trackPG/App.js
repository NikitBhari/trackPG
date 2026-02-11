import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'react-native';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';

// Import Screens
import LearningScreen from './screens/LearningScreen.js';
import FoodScreen from './screens/FoodScreen.js';
import WaterScreen from './screens/WaterScreen.js';
import ExerciseScreen from './screens/ExerciseScreen.js';
import ProductivityScreen from './screens/ProductivityScreen.js';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            switch (route.name) {
              case 'Learning':
                iconName = focused ? 'school' : 'school-outline';
                break;
              case 'Food':
                iconName = focused ? 'restaurant' : 'restaurant-outline';
                break;
              case 'Water':
                iconName = focused ? 'water' : 'water-outline';
                break;
              case 'Exercise':
                iconName = focused ? 'barbell' : 'barbell-outline';
                break;
              case 'Productivity':
                iconName = focused ? 'bulb' : 'bulb-outline';
                break;
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#4A90E2',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#4A90E2',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen name="Learning" component={LearningScreen} />
        <Tab.Screen name="Food" component={FoodScreen} />
        <Tab.Screen name="Water" component={WaterScreen} />
        <Tab.Screen name="Exercise" component={ExerciseScreen} />
        <Tab.Screen name="Productivity" component={ProductivityScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}