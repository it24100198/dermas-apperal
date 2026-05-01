import React, { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme';

// Auth
import LoginScreen from '../screens/LoginScreen';

// Main Tabs
import HomeScreen from '../screens/HomeScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ManufacturingScreen from '../screens/ManufacturingScreen';
import InventoryScreen from '../screens/InventoryScreen';
import MoreScreen from '../screens/MoreScreen';

// More Stack Screens
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import FinancialHealthScreen from '../screens/FinancialHealthScreen';
import MaterialsScreen from '../screens/MaterialsScreen';
import ProductionLogScreen from '../screens/ProductionLogScreen';
import EmployeesScreen from '../screens/EmployeesScreen';

// Purchase Sub-screens
import PurchaseScreen from '../screens/PurchaseScreen';
import SuppliersScreen from '../screens/SuppliersScreen';
import RequisitionsScreen from '../screens/RequisitionsScreen';
import PurchaseOrdersScreen from '../screens/PurchaseOrdersScreen';

// Sales Sub-screens
import SalesScreen from '../screens/SalesScreen';
import QuotationsScreen from '../screens/QuotationsScreen';
import SalesOrdersScreen from '../screens/SalesOrdersScreen';
import InvoicesScreen from '../screens/InvoicesScreen';

// Stock Sub-screens
import StockScreen from '../screens/StockScreen';
import StockAdjustmentsScreen from '../screens/StockAdjustmentsScreen';
import StockHistoryScreen from '../screens/StockHistoryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const MoreStack = createNativeStackNavigator();

const HEADER_STYLE = {
    headerStyle: { backgroundColor: colors.surface },
    headerTitleStyle: { fontWeight: '700', color: colors.textPrimary },
    headerShadowVisible: false,
    headerTintColor: colors.primary,
};

// More Stack — contains all non-tab screens
const MoreStackNavigator = () => (
    <MoreStack.Navigator screenOptions={{ ...HEADER_STYLE }}>
        <MoreStack.Screen name="MoreHome" component={MoreScreen} options={{ title: 'More', headerShown: false }} />
        <MoreStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
        <MoreStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
        <MoreStack.Screen name="Transactions" component={TransactionsScreen} options={{ title: 'Financial Ledger' }} />
        <MoreStack.Screen name="FinancialHealth" component={FinancialHealthScreen} options={{ title: 'Financial Health' }} />
        <MoreStack.Screen name="Materials" component={MaterialsScreen} options={{ title: 'Raw Materials' }} />
        <MoreStack.Screen name="ProductionLog" component={ProductionLogScreen} options={{ title: 'Hourly Production' }} />
        <MoreStack.Screen name="Employees" component={EmployeesScreen} options={{ title: 'Employee Management' }} />
        {/* Purchase */}
        <MoreStack.Screen name="Purchase" component={PurchaseScreen} options={{ title: 'Purchase Management' }} />
        <MoreStack.Screen name="Suppliers" component={SuppliersScreen} options={{ title: 'Suppliers' }} />
        <MoreStack.Screen name="Requisitions" component={RequisitionsScreen} options={{ title: 'Requisitions' }} />
        <MoreStack.Screen name="PurchaseOrders" component={PurchaseOrdersScreen} options={{ title: 'Purchase Orders' }} />
        {/* Sales */}
        <MoreStack.Screen name="Sales" component={SalesScreen} options={{ title: 'Sales Management' }} />
        <MoreStack.Screen name="Quotations" component={QuotationsScreen} options={{ title: 'Quotations' }} />
        <MoreStack.Screen name="SalesOrders" component={SalesOrdersScreen} options={{ title: 'Sales Orders' }} />
        <MoreStack.Screen name="Invoices" component={InvoicesScreen} options={{ title: 'Invoices' }} />
        {/* Stock */}
        <MoreStack.Screen name="Stock" component={StockScreen} options={{ title: 'Stock Control' }} />
        <MoreStack.Screen name="StockAdjustments" component={StockAdjustmentsScreen} options={{ title: 'Stock Adjustments' }} />
        <MoreStack.Screen name="StockIssuance" component={StockAdjustmentsScreen} options={{ title: 'Material Issuance' }} />
        <MoreStack.Screen name="StockHistory" component={StockHistoryScreen} options={{ title: 'Stock History' }} />
    </MoreStack.Navigator>
);

// Bottom Tab Navigator
const AppTabs = () => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            ...HEADER_STYLE,
            tabBarStyle: {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
                height: 60,
                paddingBottom: 8,
            },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarHideOnKeyboard: true,
            tabBarIcon: ({ focused, color, size }) => {
                const icons = {
                    Dashboard: focused ? 'home' : 'home-outline',
                    Orders: focused ? 'cart' : 'cart-outline',
                    Manufacturing: focused ? 'construct' : 'construct-outline',
                    Inventory: focused ? 'cube' : 'cube-outline',
                    More: focused ? 'grid' : 'grid-outline',
                };
                return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        })}
    >
        <Tab.Screen
            name="Dashboard"
            component={HomeScreen}
            options={{ title: 'Dashboard', headerShown: false }}
        />
        <Tab.Screen
            name="Orders"
            component={OrdersScreen}
            options={{ title: 'Orders', headerTitle: 'Customer Orders' }}
        />
        <Tab.Screen
            name="Manufacturing"
            component={ManufacturingScreen}
            options={{ title: 'Mfg', headerTitle: 'Manufacturing' }}
        />
        <Tab.Screen
            name="Inventory"
            component={InventoryScreen}
            options={{ title: 'Inventory', headerTitle: 'Product Inventory' }}
        />
        <Tab.Screen
            name="More"
            component={MoreStackNavigator}
            options={{ title: 'More', headerShown: false }}
        />
    </Tab.Navigator>
);

// Root Navigator
const AppNavigator = () => {
    const { user, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
                <ActivityIndicator size="large" color={colors.primary} />
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
