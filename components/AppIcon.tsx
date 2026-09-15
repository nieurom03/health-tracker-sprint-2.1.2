import type { ColorValue, StyleProp, ViewStyle } from 'react-native';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';

export default function AppIcon({
  ios,
  android,
  size = 22,
  color = '#2563EB',
  style,
}: {
  ios: SFSymbol;
  android: AndroidSymbol;
  size?: number;
  color?: ColorValue;
  style?: StyleProp<ViewStyle>;
}) {
  return <SymbolView
    name={{ ios, android, web: android }}
    size={size}
    tintColor={color}
    weight="semibold"
    resizeMode="scaleAspectFit"
    style={[{ width: size, height: size }, style]}
  />;
}
