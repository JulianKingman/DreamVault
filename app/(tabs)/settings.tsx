import React from 'react';
import {
  StyleSheet,
  SafeAreaView,
  Linking,
  useColorScheme,
} from 'react-native';
import {
  Text,
  YStack,
  Button,
  Switch,
  XStack,
  Separator,
  ScrollView,
} from 'tamagui';
import {
  Settings,
  Import,
  Github,
  Moon,
  Info,
  ExternalLink,
} from '@tamagui/lucide-icons';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = React.useState(colorScheme === 'dark');

  const handleImportFromNotes = () => {
    console.log('Importing from Notes...');
  };

  const handleContribute = () => {
    Linking.openURL('https://github.com/yourusername/dream-journal-app');
  };

  const handleThemeChange = (value: boolean) => {
    setIsDarkMode(value);
    console.log('Theme changed to:', value ? 'dark' : 'light');
  };

  React.useEffect(() => {
    setIsDarkMode(colorScheme === 'dark');
  }, [colorScheme]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <YStack space="$4" style={styles.container}>
          <Text fontSize="$8" fontWeight="bold" mb="$4">
            Settings
          </Text>

          <SettingsGroup title="Appearance">
            <SettingsItem
              icon={<Moon size={20} />}
              title="Dark Mode"
              right={
                <Switch
                  size="$4"
                  checked={isDarkMode}
                  onCheckedChange={handleThemeChange}
                  native
                />
              }
            />
          </SettingsGroup>

          <SettingsGroup title="Data">
            <SettingsItem
              icon={<Import size={20} />}
              title="Import from Notes"
              onPress={handleImportFromNotes}
            />
          </SettingsGroup>

          <SettingsGroup title="About">
            <SettingsItem
              icon={<Github size={20} />}
              title="Contribute"
              onPress={handleContribute}
              right={<ExternalLink size={16} />}
            />
            <SettingsItem
              icon={<Info size={20} />}
              title="App Version"
              right={<Text color="$gray10">1.0.0</Text>}
            />
          </SettingsGroup>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <YStack space="$2" mb="$4">
      <Text fontSize="$5" fontWeight="bold" color="$gray11">
        {title}
      </Text>
      <YStack backgroundColor="$background" borderRadius="$4">
        {children}
      </YStack>
    </YStack>
  );
}

function SettingsItem({
  icon,
  title,
  onPress,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <XStack
      alignItems="center"
      space="$3"
      paddingVertical="$3"
      paddingHorizontal="$4"
      pressStyle={{ opacity: 0.8 }}
      onPress={onPress}
    >
      {icon}
      <Text flex={1}>{title}</Text>
      {right}
    </XStack>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
});
