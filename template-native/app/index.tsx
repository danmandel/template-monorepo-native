import { Redirect } from 'expo-router';

export const IndexScreen = () => {
  return <Redirect href='/(drawer)/(tabs)/home' />;
};

export default IndexScreen;
