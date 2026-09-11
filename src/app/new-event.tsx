import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { createEvent, type EventVisibility } from '@/lib/couple-events';
import { INTL_LOCALE } from '@/lib/format';
import { useTranslation } from '@/lib/i18n';

const DURATION_STEP_HOURS = 0.5;
const MIN_DURATION_HOURS = 0.5;
const MAX_DURATION_HOURS = 12;

export default function NewEventScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const { session, couple, partner } = useAuth();

  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d;
  });
  const [durationHours, setDurationHours] = useState(2);
  const [visibility, setVisibility] = useState<EventVisibility>('los_dos');
  const [googleSyncEnabled, setGoogleSyncEnabled] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const partnerFirstName = partner?.display_name?.split(' ')?.[0] ?? (locale === 'en' ? 'your partner' : 'tu pareja');
  const intlLocale = INTL_LOCALE[locale];

  function onPickerChange(_event: unknown, selected?: Date) {
    setPickerMode(null);
    if (!selected) return;
    setStartsAt((prev) => {
      const next = new Date(prev);
      if (pickerMode === 'date') {
        next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      } else {
        next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      }
      return next;
    });
  }

  function adjustDuration(delta: number) {
    setDurationHours((prev) => Math.min(MAX_DURATION_HOURS, Math.max(MIN_DURATION_HOURS, prev + delta)));
  }

  async function handleSave() {
    if (!title.trim() || !session?.user || !couple) return;
    setSaving(true);
    setErrorMessage(null);
    try {
      const endsAt = new Date(startsAt.getTime() + durationHours * 60 * 60 * 1000);
      await createEvent({
        coupleId: couple.id,
        ownerId: session.user.id,
        title: title.trim(),
        startsAt,
        endsAt,
        visibility,
        googleSyncEnabled,
      });
      router.back();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t.newEvent.saveError);
    } finally {
      setSaving(false);
    }
  }

  const dateLabel = startsAt
    .toLocaleDateString(intlLocale, { weekday: 'short', day: 'numeric', month: 'short' })
    .replace('.', '');
  const timeLabel = startsAt.toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' });
  const durationLabel = `${durationHours} h`;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <ThemedText type="small" themeColor="textSecondary">
              {t.checkIn.cancel}
            </ThemedText>
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
            {t.newEvent.new}
          </ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[styles.titleField, { borderColor: theme.neutral800 }]}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t.newEvent.titlePlaceholder}
              placeholderTextColor={theme.neutral500}
              style={[styles.titleInput, { color: theme.text }]}
            />
          </View>

          <View style={styles.rows}>
            <View style={styles.row}>
              <ThemedText themeColor="neutral300">{t.newEvent.when}</ThemedText>
              <View style={styles.chipRow}>
                <Pressable
                  onPress={() => setPickerMode('date')}
                  style={[styles.chip, { borderColor: theme.neutral800 }]}>
                  <ThemedText type="small">{dateLabel}</ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => setPickerMode('time')}
                  style={[styles.chip, { borderColor: theme.neutral800 }]}>
                  <ThemedText type="small">{timeLabel}</ThemedText>
                </Pressable>
              </View>
            </View>

            {pickerMode && (
              <DateTimePicker
                value={startsAt}
                mode={pickerMode}
                is24Hour
                onChange={onPickerChange}
              />
            )}

            <View style={styles.row}>
              <ThemedText themeColor="neutral300">{t.newEvent.duration}</ThemedText>
              <View style={styles.durationStepper}>
                <Pressable
                  hitSlop={8}
                  onPress={() => adjustDuration(-DURATION_STEP_HOURS)}
                  style={[styles.stepperButton, { borderColor: theme.neutral800 }]}>
                  <ThemedText>−</ThemedText>
                </Pressable>
                <ThemedText type="small" style={styles.durationLabel}>
                  {durationLabel}
                </ThemedText>
                <Pressable
                  hitSlop={8}
                  onPress={() => adjustDuration(DURATION_STEP_HOURS)}
                  style={[styles.stepperButton, { borderColor: theme.neutral800 }]}>
                  <ThemedText>+</ThemedText>
                </Pressable>
              </View>
            </View>

            <View style={styles.row}>
              <ThemedText themeColor="neutral300">{t.newEvent.repeat}</ThemedText>
              <ThemedText themeColor="neutral500">{t.newEvent.never}</ThemedText>
            </View>
          </View>

          <View style={styles.visibilityBlock}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
              {t.newEvent.visibleFor}
            </ThemedText>
            <View style={[styles.segmented, { borderColor: theme.neutral800 }]}>
              {(['solo_yo', 'los_dos'] as const).map((option) => (
                <Pressable key={option} style={styles.segmentedOpt} onPress={() => setVisibility(option)}>
                  <ThemedView
                    type={visibility === option ? 'backgroundSelected' : undefined}
                    style={styles.segmentedOptInner}>
                    <ThemedText
                      type="small"
                      themeColor={visibility === option ? 'accent100' : 'textSecondary'}>
                      {option === 'solo_yo' ? t.newEvent.onlyMe : t.newEvent.bothOfUs}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              ))}
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {visibility === 'los_dos' ? t.newEvent.partnerSeesIt(partnerFirstName) : t.newEvent.onlyYouSeeIt}
            </ThemedText>
          </View>

          <View style={[styles.googleRow, { borderColor: theme.neutral900 }]}>
            <View style={styles.googleRowText}>
              <ThemedText>{t.newEvent.googleCalendar}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {session?.user.email ? t.newEvent.googleSyncHint(session.user.email) : t.newEvent.googleSyncHintGeneric}
              </ThemedText>
            </View>
            <Switch
              value={googleSyncEnabled}
              onValueChange={setGoogleSyncEnabled}
              trackColor={{ false: theme.neutral800, true: theme.accent700 }}
              thumbColor={theme.accent100}
            />
          </View>

          {errorMessage && (
            <ThemedText type="small" themeColor="textSecondary">
              {errorMessage}
            </ThemedText>
          )}
        </ScrollView>

        <Pressable
          onPress={handleSave}
          disabled={!title.trim() || saving}
          style={[styles.saveButton, { borderColor: theme.accent }, (!title.trim() || saving) && styles.saveButtonDisabled]}>
          <ThemedText type="subtitle" themeColor="accent200">
            {saving ? t.newEvent.saving : t.newEvent.save}
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
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
  scrollContent: {
    gap: Spacing.four,
    paddingBottom: Spacing.three,
  },
  titleField: {
    borderBottomWidth: 1,
    paddingBottom: Spacing.two,
  },
  titleInput: {
    fontFamily: 'Inter_500Medium',
    fontSize: 24,
  },
  rows: {
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.two - 2,
    paddingHorizontal: Spacing.three - 4,
  },
  durationStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepperButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationLabel: {
    minWidth: 36,
    textAlign: 'center',
  },
  visibilityBlock: {
    gap: Spacing.two,
  },
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 3,
    gap: 4,
  },
  segmentedOpt: {
    flex: 1,
  },
  segmentedOptInner: {
    borderRadius: Radius.md - 2,
    paddingVertical: Spacing.two + 1,
    alignItems: 'center',
  },
  googleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    borderTopWidth: 1,
    paddingTop: Spacing.four,
  },
  googleRowText: {
    flex: 1,
    gap: 3,
  },
  saveButton: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
});
