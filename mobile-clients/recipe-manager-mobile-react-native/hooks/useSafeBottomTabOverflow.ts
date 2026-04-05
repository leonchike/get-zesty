import { useContext } from 'react';
import { Platform } from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useSafeBottomTabOverflow() {
  if (Platform.OS !== 'ios') {
    return 0;
  }

  // Try to get the bottom tab bar height context
  const tabBarHeight = useContext(BottomTabBarHeightContext);
  const { bottom } = useSafeAreaInsets();
  
  // If we're not in a bottom tab navigator context, tabBarHeight will be undefined
  if (tabBarHeight === undefined || tabBarHeight === null) {
    return 0;
  }
  
  return tabBarHeight - bottom;
}