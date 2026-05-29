import FontAwesomeIcon from '@expo/vector-icons/FontAwesome';
import type { StyleProp, TextStyle } from 'react-native';

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export const Icon = ({ name, size = 24, color, style }: IconProps) => {
  return <FontAwesomeIcon name={name as any} size={size} color={color} style={style} />;
};

export { default as FontAwesome } from '@expo/vector-icons/FontAwesome';
