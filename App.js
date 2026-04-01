import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { View, ActivityIndicator } from 'react-native';

import TitleScreen       from './src/screens/TitleScreen';
import CharSelectScreen  from './src/screens/CharSelectScreen';
import GameScreen        from './src/screens/GameScreen';
import ResultScreen      from './src/screens/ResultScreen';
import StageMapScreen          from './src/screens/StageMapScreen';
import StageGameScreen         from './src/screens/StageGameScreen';
import StageResultScreen       from './src/screens/StageResultScreen';
import AdventureBossScreen     from './src/screens/AdventureBossScreen';
import BossIntroScreen         from './src/screens/BossIntroScreen';
import AdventureBossResultScreen from './src/screens/AdventureBossResultScreen';
import CharAcquiredScreen        from './src/screens/CharAcquiredScreen';
import SettingsScreen            from './src/screens/SettingsScreen';
import StatsScreen               from './src/screens/StatsScreen';
import { COLORS }        from './src/constants/gameConfig';

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({ PressStart2P: PressStart2P_400Regular });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Title"
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="Title"       component={TitleScreen}       />
        <Stack.Screen name="CharSelect"  component={CharSelectScreen}  />
        <Stack.Screen name="Game"        component={GameScreen}        />
        <Stack.Screen name="Result"      component={ResultScreen}      />
        <Stack.Screen name="StageMap"            component={StageMapScreen}           />
        <Stack.Screen name="StageGame"           component={StageGameScreen}          initialParams={{ stageId: 1 }} />
        <Stack.Screen name="StageResult"         component={StageResultScreen}        />
        <Stack.Screen name="BossIntro"            component={BossIntroScreen}           initialParams={{ vsId: 'vs1' }} />
        <Stack.Screen name="AdventureBoss"       component={AdventureBossScreen}      initialParams={{ vsId: 'vs1' }} />
        <Stack.Screen name="AdventureBossResult" component={AdventureBossResultScreen} />
        <Stack.Screen name="CharAcquired"        component={CharAcquiredScreen}        />
        <Stack.Screen name="Settings"            component={SettingsScreen}            />
        <Stack.Screen name="Stats"               component={StatsScreen}               />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
