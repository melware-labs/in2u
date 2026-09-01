import * as Linking from 'expo-linking';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createSessionFromUrl, signInWithGoogle } from '@/lib/google-auth';

export default function LoginScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const handledUrl = useRef<string | null>(null);

  // Red de respaldo: `WebBrowser.openAuthSessionAsync` a veces no intercepta
  // la vuelta a la app después del login (más común en Expo Go). Si eso
  // pasa, el sistema operativo igual reabre la app con la URL del deep
  // link — este listener la agarra y crea la sesión desde ahí.
  const url = Linking.useLinkingURL();
  useEffect(() => {
    if (!url || url === handledUrl.current) return;
    handledUrl.current = url;
    createSessionFromUrl(url).catch((err) => {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    });
  }, [url]);

  async function handlePress() {
    setErrorMessage(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      // Si el login fue exitoso, el AuthProvider detecta la sesión nueva y
      // RootNavigator redirige solo — no hace falta navegar a mano acá.
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.hero}>
          <ThemedText type="title" style={styles.title}>
            in2u
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Un espacio compartido para organizarse y saber cómo está el otro,{'\n'}
            todos los días.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.actions}>
          <Pressable
            onPress={handlePress}
            disabled={loading}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.text },
              pressed && styles.buttonPressed,
            ]}>
            {loading ? (
              <ActivityIndicator />
            ) : (
              <ThemedText type="smallBold" themeColor="background">
                Continuar con Google
              </ThemedText>
            )}
          </Pressable>

          {errorMessage && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.error}>
              {errorMessage}
            </ThemedText>
          )}

          <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
            Usamos tu cuenta de Google para el login y, si querés, para sincronizar tu
            Google Calendar más adelante.
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  actions: {
    gap: Spacing.three,
  },
  button: {
    borderRadius: Spacing.five,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  error: {
    textAlign: 'center',
  },
  disclaimer: {
    textAlign: 'center',
  },
});
