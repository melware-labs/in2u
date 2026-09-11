import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { createCouple, joinCouple } from '@/lib/couples';

type Mode = 'choose' | 'create' | 'join';

export default function OnboardingScreen() {
  const { session, refreshCouple } = useAuth();
  const theme = useTheme();
  const [mode, setMode] = useState<Mode>('choose');
  const [code, setCode] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleCreate() {
    if (!session?.user) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const couple = await createCouple(session.user.id);
      setInviteCode(couple.invite_code);
      setMode('create');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo crear la pareja.');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!code.trim()) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      await joinCouple(code);
      await refreshCouple();
      // Con la pareja ya vinculada, RootNavigator redirige solo a (tabs).
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Código inválido o ya utilizado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {mode === 'choose' && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.centerText}>
              Vincula a tu pareja
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.centerText}>
              Uno de los dos genera un código y el otro lo ingresa. Así quedan conectados.
            </ThemedText>

            <Pressable
              onPress={handleCreate}
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
                  Generar código
                </ThemedText>
              )}
            </Pressable>

            <Pressable onPress={() => setMode('join')} style={styles.secondaryButton}>
              <ThemedText type="link">Ya tengo un código</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {mode === 'create' && inviteCode && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.centerText}>
              Comparte este código
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.codeBox}>
              <ThemedText type="title" style={styles.codeText}>
                {inviteCode}
              </ThemedText>
            </ThemedView>
            <ThemedText themeColor="textSecondary" style={styles.centerText}>
              Pasáselo a tu pareja para que lo ingrese desde su cuenta. En cuanto lo haga,
              vas a ver la app compartida automáticamente.
            </ThemedText>
          </ThemedView>
        )}

        {mode === 'join' && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.centerText}>
              Ingresa el código
            </ThemedText>
            <TextInput
              value={code}
              onChangeText={(text) => setCode(text.toUpperCase())}
              placeholder="XXXXXX"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
            />
            <Pressable
              onPress={handleJoin}
              disabled={loading || code.trim().length === 0}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: theme.text },
                pressed && styles.buttonPressed,
              ]}>
              {loading ? (
                <ActivityIndicator />
              ) : (
                <ThemedText type="smallBold" themeColor="background">
                  Vincular
                </ThemedText>
              )}
            </Pressable>
            <Pressable onPress={() => setMode('choose')} style={styles.secondaryButton}>
              <ThemedText type="link">Volver</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {errorMessage && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
            {errorMessage}
          </ThemedText>
        )}
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
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.three,
    alignItems: 'stretch',
  },
  centerText: {
    textAlign: 'center',
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
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  codeBox: {
    borderRadius: Spacing.four,
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
  codeText: {
    letterSpacing: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 24,
    letterSpacing: 6,
    textAlign: 'center',
  },
});
