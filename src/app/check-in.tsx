import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { MOOD_OPTIONS, upsertTodayCheckin, type Mood } from '@/lib/mood';

export default function CheckInScreen() {
  const theme = useTheme();
  const { session, couple, partner } = useAuth();
  const [selected, setSelected] = useState<Mood | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleShare() {
    if (!selected || !session?.user || !couple) return;
    setSaving(true);
    setErrorMessage(null);
    try {
      await upsertTodayCheckin({
        coupleId: couple.id,
        userId: session.user.id,
        mood: selected,
        note: note.trim() || null,
      });
      router.back();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo guardar el check-in.');
    } finally {
      setSaving(false);
    }
  }

  const partnerFirstName = partner?.display_name?.split(' ')?.[0] ?? 'tu pareja';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <ThemedText type="small" themeColor="textSecondary">
              Cancelar
            </ThemedText>
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
            1 por día
          </ThemedText>
        </ThemedView>

        <ThemedText type="title">¿Cómo estás{'\n'}hoy?</ThemedText>

        <ThemedView style={styles.options}>
          {MOOD_OPTIONS.map((option) => {
            const isSelected = option.mood === selected;
            return (
              <Pressable
                key={option.mood}
                onPress={() => setSelected(option.mood)}
                style={[
                  styles.optionRow,
                  { borderColor: isSelected ? theme.accent : theme.neutral800 },
                  isSelected && { backgroundColor: theme.accent900 },
                ]}>
                <ThemedView
                  style={[
                    styles.optionEmojiBadge,
                    { backgroundColor: isSelected ? theme.accent800 : `${theme.accent500}1F` },
                  ]}>
                  <ThemedText style={styles.optionEmoji}>{option.emoji}</ThemedText>
                </ThemedView>
                <ThemedText style={styles.optionLabel} themeColor={isSelected ? 'accent200' : 'text'}>
                  {option.label}
                </ThemedText>
                {isSelected && (
                  <ThemedText type="small" themeColor="accent300" style={styles.eyebrow}>
                    elegido
                  </ThemedText>
                )}
              </Pressable>
            );
          })}
        </ThemedView>

        <ThemedView style={styles.noteBlock}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
            Nota — opcional
          </ThemedText>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={`Una línea para ${partnerFirstName}…`}
            placeholderTextColor={theme.neutral500}
            multiline
            style={[styles.noteInput, { color: theme.text, borderColor: theme.neutral800, backgroundColor: theme.backgroundElement }]}
          />
        </ThemedView>

        <ThemedView style={styles.footer}>
          <Pressable
            onPress={handleShare}
            disabled={!selected || saving}
            style={[
              styles.shareButton,
              { borderColor: theme.accent },
              (!selected || saving) && styles.shareButtonDisabled,
            ]}>
            {saving ? (
              <ActivityIndicator color={theme.accent200} />
            ) : (
              <ThemedText type="subtitle" themeColor="accent200">
                Compartir con {partnerFirstName}
              </ThemedText>
            )}
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary" style={styles.footerHint}>
            Le llega ahora, incluso con la app cerrada.
          </ThemedText>
          {errorMessage && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.footerHint}>
              {errorMessage}
            </ThemedText>
          )}
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  options: {
    gap: Spacing.two,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.two + 5,
    paddingHorizontal: Spacing.three,
  },
  optionEmojiBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionEmoji: {
    fontSize: 20,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
  },
  noteBlock: {
    gap: Spacing.two,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    minHeight: 66,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  footer: {
    marginTop: 'auto',
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  shareButton: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonDisabled: {
    opacity: 0.4,
  },
  footerHint: {
    textAlign: 'center',
  },
});
