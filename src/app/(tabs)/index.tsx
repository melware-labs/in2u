import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

export default function HomeScreen() {
  const { session } = useAuth();
  const firstName = session?.user.user_metadata?.full_name?.split(' ')?.[0];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          {firstName ? `Hola, ${firstName}` : 'Hola'}
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="subtitle">¿Cómo te sentís hoy?</ThemedText>
          <ThemedText themeColor="textSecondary">
            El check-in de ánimo en tiempo real llega en la Fase B — todavía no está
            conectado.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.four,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
  },
});
