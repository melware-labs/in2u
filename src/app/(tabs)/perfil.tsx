import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from '@/lib/i18n';

export default function PerfilScreen() {
  const { session, couple, signOut } = useAuth();
  const { t } = useTranslation();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          {t.perfil.title}
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {t.perfil.account}
          </ThemedText>
          <ThemedText>{session?.user.user_metadata?.full_name ?? session?.user.email}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {session?.user.email}
          </ThemedText>
        </ThemedView>

        {couple && (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {t.perfil.coupleCode}
            </ThemedText>
            <ThemedText type="subtitle" style={styles.code}>
              {couple.invite_code}
            </ThemedText>
          </ThemedView>
        )}

        <Pressable
          onPress={signOut}
          style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}>
          <ThemedText type="smallBold" themeColor="text">
            {t.perfil.signOut}
          </ThemedText>
        </Pressable>
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.three,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  code: {
    letterSpacing: 6,
  },
  signOutButton: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
});
