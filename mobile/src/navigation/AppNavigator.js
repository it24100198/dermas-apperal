import React, { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AuthContext } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import InventoryScreen from '../screens/InventoryScreen';
import JobsScreen from '../screens/JobsScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MoreStackNav = createNativeStackNavigator();
const MoreStack = () => (
    <MoreStackNav.Navigator screenOptions={{ headerShown: false }}>
        <MoreStackNav.Screen name="Profile" component={ProfileScreen} />
        <MoreStackNav.Screen name="Transactions" component={TransactionsScreen} options={{ headerShown: true, title: 'Financial Ledger' }} />
    </MoreStackNav.Navigator>
);

const AppTabs = () => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            headerStyle: { backgroundColor: '#FFFFFF' },
            tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#E5E7EB' },
            tabBarActiveTintColor: '#3B82F6',
            tabBarInactiveTintColor: '#9CA3AF',
            tabBarIcon: ({ focused, color, size }) => {
                let iconName;

                if (route.name === 'Dashboard') {
                    iconName = focused ? 'home' : 'home-outline';
                } else if (route.name === 'Orders') {
                    iconName = focused ? 'cart' : 'cart-outline';
                } else if (route.name === 'Jobs') {
                    iconName = focused ? 'construct' : 'construct-outline';
                } else if (route.name === 'Inventory') {
                    iconName = focused ? 'cube' : 'cube-outline';
                } else if (route.name === 'Accounts') {
                    iconName = focused ? 'person' : 'person-outline';
                }

                return <Ionicons name={iconName} size={size} color={color} />;
            },
        })}
    >
        <Tab.Screen name="Dashboard" component={HomeScreen} />
        <Tab.Screen name="Orders" component={OrdersScreen} />
        <Tab.Screen name="Jobs" component={JobsScreen} />
        <Tab.Screen name="Inventory" component={InventoryScreen} />
        <Tab.Screen name="Accounts" component={MoreStack} />
    </Tab.Navigator>
);

const AppNavigator = () => {
    const { user, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <Stack.Screen name="AppTabs" component={AppTabs} />
                ) : (
                    <Stack.Screen name="Login" component={LoginScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
