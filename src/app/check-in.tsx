import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/lib/i18n';
import { MOOD_OPTIONS, upsertTodayCheckin, type Mood } from '@/lib/mood';
import { supabase } from '@/lib/supabase';

export default function CheckInScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
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

      // Fire-and-forget: clasifica el check-in con Gemini y arma el tip
      // de "Consejos" para la pareja (Fase D). Si falla, no rompe nada acá
      // — el check-in ya se guardó.
      supabase.functions
        .invoke('analyze-checkin', { body: { coupleId: couple.id, checkinAuthorId: session.user.id } })
        .catch((err) => console.warn('No se pudo generar el tip del día:', err));

      router.back();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t.checkIn.saveError);
    } finally {
      setSaving(false);
    }
  }

  const partnerFirstName = partner?.display_name?.split(' ')?.[0] ?? (locale === 'en' ? 'your partner' : 'tu pareja');

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <ThemedText type="small" themeColor="textSecondary">
              {t.checkIn.cancel}
            </ThemedText>
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
            {t.checkIn.onePerDay}
          </ThemedText>
        </ThemedView>

        <ThemedText type="title">{t.checkIn.title}</ThemedText>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
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
                      {t.checkIn.chosen}
                    </ThemedText>
                  )}
                </Pressable>
              );
            })}
          </ThemedView>

          <ThemedView style={styles.noteBlock}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
              {t.checkIn.noteOptional}
            </ThemedText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t.checkIn.notePlaceholder(partnerFirstName)}
              placeholderTextColor={theme.neutral500}
              multiline
              style={[styles.noteInput, { color: theme.text, borderColor: theme.neutral800, backgroundColor: theme.backgroundElement }]}
            />
          </ThemedView>
        </ScrollView>

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
                {t.checkIn.shareWith(partnerFirstName)}
              </ThemedText>
            )}
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary" style={styles.footerHint}>
            {t.checkIn.deliveredNow}
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
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: Spacing.four,
    paddingBottom: Spacing.three,
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
