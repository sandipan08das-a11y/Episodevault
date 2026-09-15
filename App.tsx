import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Loader } from './src/components';
import { C } from './src/theme';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import HomeScreen from './src/screens/user/HomeScreen';
import MyEpisodesScreen from './src/screens/user/MyEpisodesScreen';
import ProfileScreen from './src/screens/user/ProfileScreen';
import EpisodeDetailsScreen from './src/screens/user/EpisodeDetailsScreen';
import PaymentScreen from './src/screens/user/PaymentScreen';
import VideoPlayerScreen from './src/screens/user/VideoPlayerScreen';
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';
import AdminEpisodesScreen from './src/screens/admin/AdminEpisodesScreen';
import AdminPaymentsScreen from './src/screens/admin/AdminPaymentsScreen';
import AddEditEpisodeScreen from './src/screens/admin/AddEditEpisodeScreen';

const Stack=createNativeStackNavigator(); const Tabs=createBottomTabNavigator();
const theme={...DefaultTheme,colors:{...DefaultTheme.colors,background:C.bg,card:C.bg,text:C.text,border:C.border,primary:C.accent}};
function UserTabs(){return <Tabs.Navigator screenOptions={{headerShown:false,tabBarStyle:{backgroundColor:C.card,borderTopColor:C.border,height:64},tabBarActiveTintColor:C.text,tabBarInactiveTintColor:C.muted}}><Tabs.Screen name="Home" component={HomeScreen}/><Tabs.Screen name="My Episodes" component={MyEpisodesScreen}/><Tabs.Screen name="Profile" component={ProfileScreen}/></Tabs.Navigator>}
function AdminTabs(){return <Tabs.Navigator screenOptions={{headerShown:false,tabBarStyle:{backgroundColor:C.card,borderTopColor:C.border,height:64},tabBarActiveTintColor:C.text,tabBarInactiveTintColor:C.muted}}><Tabs.Screen name="Dashboard" component={AdminDashboardScreen}/><Tabs.Screen name="Episodes" component={AdminEpisodesScreen}/><Tabs.Screen name="Payments" component={AdminPaymentsScreen}/><Tabs.Screen name="Profile" component={ProfileScreen}/></Tabs.Navigator>}
function Root(){const {session,profile,loading}=useAuth(); if(loading)return <Loader/>; return <NavigationContainer theme={theme}><Stack.Navigator screenOptions={{headerStyle:{backgroundColor:C.bg},headerTintColor:C.text,contentStyle:{backgroundColor:C.bg}}}>{!session?<><Stack.Screen name="Login" component={LoginScreen}/><Stack.Screen name="Signup" component={SignupScreen}/></>:profile?.role==='admin'?<><Stack.Screen name="Admin" component={AdminTabs} options={{headerShown:false}}/><Stack.Screen name="AddEditEpisode" component={AddEditEpisodeScreen} options={{title:'Episode'}}/></>:<><Stack.Screen name="User" component={UserTabs} options={{headerShown:false}}/><Stack.Screen name="EpisodeDetails" component={EpisodeDetailsScreen} options={{title:'Episode'}}/><Stack.Screen name="Payment" component={PaymentScreen} options={{title:'Unlock Episode'}}/><Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{headerShown:false}}/></>}</Stack.Navigator></NavigationContainer>}
export default function App(){return <AuthProvider><StatusBar style="light"/><Root/></AuthProvider>}
