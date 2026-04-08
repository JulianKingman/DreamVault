import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Text, YStack } from 'tamagui';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <YStack style={styles.container}>
        <Text fontSize="$7" fontWeight="bold">This screen doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          <Text color="$blue10">Go to home screen!</Text>
        </Link>
      </YStack>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
