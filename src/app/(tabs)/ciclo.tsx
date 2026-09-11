import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import {
  computeCyclePhase,
  getOwnCycleSettings,
  getOwnLastPeriodStart,
  getTodaySymptoms,
  logPeriodStart,
  toggleSymptom,
  updatePartnerVisibility,
  SYMPTOMS,
  type CyclePhase,
  type CyclePhaseResult,
  type CycleSettings,
  type PartnerVisibility,
  type Symptom,
} from '@/lib/cycle';
import { formatDayHeader, INTL_LOCALE } from '@/lib/format';
import { useTranslation } from '@/lib/i18n';

const DEFAULT_CYCLE_LENGTH = 29;
const DEFAULT_PERIOD_LENGTH = 5;

export default function CicloScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const { session, partner } = useAuth();
  const userId = session?.user.id;

  const [settings, setSettings] = useState<CycleSettings | null>(null);
  const [lastPeriodStart, setLastPeriodStart] = useState<Date | null>(null);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const [settingsData, lastPeriod, todaySymptoms] = await Promise.all([
        getOwnCycleSettings(userId),
        getOwnLastPeriodStart(userId),
        getTodaySymptoms(userId),
      ]);
      setSettings(settingsData);
      setLastPeriodStart(lastPeriod);
      setSymptoms(todaySymptoms);
    } catch (err) {
      console.error('No se pudo cargar el ciclo:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const cycleLength = settings?.average_cycle_length_days ?? DEFAULT_CYCLE_LENGTH;
  const periodLength = settings?.average_period_length_days ?? DEFAULT_PERIOD_LENGTH;
  const partnerVisibility = settings?.partner_visibility ?? 'nada';

  const phase: CyclePhaseResult | null = lastPeriodStart
    ? computeCyclePhase(lastPeriodStart, cycleLength, periodLength)
    : null;

  async function handleToggleSymptom(symptom: Symptom) {
    if (!userId) return;
    const previous = symptoms;
    setSymptoms((prev) => (prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]));
    try {
      await toggleSymptom(userId, symptom, previous);
    } catch (err) {
      setSymptoms(previous);
      console.error('No se pudo guardar el síntoma:', err);
    }
  }

  async function handleLogPeriodStart() {
    if (!userId) return;
    try {
      await logPeriodStart(userId);
      await load();
    } catch (err) {
      console.error('No se pudo registrar el inicio del período:', err);
    }
  }

  async function handleVisibilityChange(level: PartnerVisibility) {
    if (!userId) return;
    const previous = partnerVisibility;
    setSettings((prev) =>
      prev
        ? { ...prev, partner_visibility: level }
        : {
            user_id: userId,
            average_cycle_length_days: DEFAULT_CYCLE_LENGTH,
            average_period_length_days: DEFAULT_PERIOD_LENGTH,
            partner_visibility: level,
            updated_at: new Date().toISOString(),
          }
    );
    try {
      await updatePartnerVisibility(userId, level);
    } catch (err) {
      setSettings((prev) => (prev ? { ...prev, partner_visibility: previous } : prev));
      console.error('No se pudo actualizar la privacidad:', err);
    }
  }

  const partnerFirstName = partner?.display_name?.split(' ')?.[0] ?? (locale === 'en' ? 'your partner' : 'tu pareja');
  const intlLocale = INTL_LOCALE[locale];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            {t.ciclo.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
            {formatDayHeader(locale)}
          </ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ThemedView style={[styles.phaseCard, { borderColor: theme.accent800, backgroundColor: theme.accent900 }]}>
            {phase ? (
              <>
                <View style={styles.phaseHeaderRow}>
                  <ThemedText type="title" themeColor="accent100">
                    {locale === 'en' ? `Day ${phase.dayOfCycle}` : `Día ${phase.dayOfCycle}`}
                  </ThemedText>
                  <ThemedText themeColor="neutral300">
                    {locale === 'en' ? `of ${phase.cycleLength}` : `de ${phase.cycleLength}`}
                  </ThemedText>
                </View>
                <ThemedText themeColor="accent200">{t.ciclo.phases[phase.phase]}</ThemedText>
                <PhaseBar cycleLength={phase.cycleLength} periodLength={periodLength} phase={phase.phase} theme={theme} />
                <View style={[styles.phaseStatsRow, { borderColor: theme.accent800 }]}>
                  <View style={styles.phaseStat}>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
                      {t.ciclo.nextPeriod}
                    </ThemedText>
                    <ThemedText themeColor="text">{t.ciclo.inDays(phase.daysUntilNextPeriod)}</ThemedText>
                  </View>
                  <View style={styles.phaseStat}>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
                      {t.ciclo.fertileWindow}
                    </ThemedText>
                    <ThemedText themeColor="text">
                      {new Date(phase.fertileWindowStart).toLocaleDateString(intlLocale, { day: 'numeric', month: 'short' })}
                    </ThemedText>
                  </View>
                </View>
              </>
            ) : (
              !loading && (
                <>
                  <ThemedText themeColor="neutral200">{t.ciclo.notRegisteredYet}</ThemedText>
                  <Pressable
                    onPress={handleLogPeriodStart}
                    style={[styles.logPeriodButton, { borderColor: theme.accent600 }]}>
                    <ThemedText themeColor="accent200">{t.ciclo.startedToday}</ThemedText>
                  </Pressable>
                </>
              )
            )}
          </ThemedView>

          {phase && (
            <Pressable onPress={handleLogPeriodStart}>
              <ThemedText type="small" themeColor="accent300" style={styles.logAgainLink}>
                {t.ciclo.logAgain}
              </ThemedText>
            </Pressable>
          )}

          <View style={styles.section}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
              {t.ciclo.registerToday}
            </ThemedText>
            <View style={styles.pillRow}>
              {SYMPTOMS.map((symptom) => {
                const active = symptoms.includes(symptom);
                return (
                  <Pressable
                    key={symptom}
                    onPress={() => handleToggleSymptom(symptom)}
                    style={[
                      styles.pill,
                      {
                        borderColor: active ? theme.accent600 : theme.neutral800,
                        backgroundColor: active ? theme.accent900 : 'transparent',
                      },
                    ]}>
                    <ThemedText type="small" themeColor={active ? 'accent100' : 'text'}>
                      {t.ciclo.symptoms[symptom]}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <ThemedView type="backgroundElement" style={styles.visibilityCard}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
              {t.ciclo.whatPartnerSees(partnerFirstName)}
            </ThemedText>
            <View style={[styles.segmented, { borderColor: theme.neutral800 }]}>
              {(['nada', 'avisos', 'fase_y_avisos'] as const).map((level) => (
                <Pressable key={level} style={styles.segmentedOpt} onPress={() => handleVisibilityChange(level)}>
                  <ThemedView
                    type={partnerVisibility === level ? 'backgroundSelected' : undefined}
                    style={styles.segmentedOptInner}>
                    <ThemedText
                      type="small"
                      themeColor={partnerVisibility === level ? 'accent100' : 'textSecondary'}
                      numberOfLines={1}>
                      {t.ciclo.visibility[level]}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              ))}
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {t.ciclo.privacyHint}
            </ThemedText>
          </ThemedView>

          <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
            {t.ciclo.disclaimer}
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function PhaseBar({
  cycleLength,
  periodLength,
  phase,
  theme,
}: {
  cycleLength: number;
  periodLength: number;
  phase: CyclePhase;
  theme: ReturnType<typeof useTheme>;
}) {
  const remaining = Math.max(cycleLength - periodLength, 1);
  const folicular = Math.round((remaining * 8.0) / 24);
  const ovulacion = Math.round((remaining * 4.0) / 24);
  const lutea = Math.max(cycleLength - periodLength - folicular - ovulacion, 1);

  const segments: { key: CyclePhase; flex: number }[] = [
    { key: 'menstrual', flex: periodLength },
    { key: 'folicular', flex: folicular },
    { key: 'ovulacion', flex: ovulacion },
    { key: 'lutea', flex: lutea },
  ];

  return (
    <View style={styles.phaseBarRow}>
      {segments.map((segment) => (
        <View
          key={segment.key}
          style={[
            styles.phaseBarSegment,
            {
              flex: segment.flex,
              backgroundColor: segment.key === phase ? theme.accent400 : `${theme.accent500}38`,
            },
          ]}
        />
      ))}
    </View>
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
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scrollContent: {
    gap: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  phaseCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three + 2,
    gap: Spacing.three,
  },
  phaseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  phaseBarRow: {
    flexDirection: 'row',
    gap: 3,
    height: 8,
  },
  phaseBarSegment: {
    borderRadius: 4,
  },
  phaseStatsRow: {
    flexDirection: 'row',
    gap: Spacing.four,
    borderTopWidth: 1,
    paddingTop: Spacing.two + 2,
  },
  phaseStat: {
    gap: 2,
  },
  logPeriodButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.two - 2,
    paddingHorizontal: Spacing.three,
  },
  logAgainLink: {
    textAlign: 'center',
  },
  section: {
    gap: Spacing.two + 1,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: Spacing.two - 2,
    paddingHorizontal: Spacing.three - 2,
  },
  visibilityCard: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.two + 1,
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
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  disclaimer: {
    textAlign: 'left',
  },
});
