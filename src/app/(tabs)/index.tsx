import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { CYCLE_CARE_TIPS_EN, CYCLE_CARE_TIPS_ES } from '@/content/cycle-care-tips';
import { useAuth } from '@/contexts/auth-context';
import { useMoodRealtime } from '@/hooks/use-mood-realtime';
import { useTheme } from '@/hooks/use-theme';
import { getPartnerCycleSummary, type PartnerCycleSummary } from '@/lib/cycle';
import { currentWeekDays, formatDayHeader, formatRelativeTime, toDateKey, weekdayLetter } from '@/lib/format';
import { useTranslation } from '@/lib/i18n';
import { MOOD_OPTIONS, moodOption, type MoodCheckin } from '@/lib/mood';

export default function HomeScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const { session, partner, couple } = useAuth();
  const { checkins, ownToday, partnerLatest, loading } = useMoodRealtime(couple?.id, session?.user.id);
  const [cycleSummary, setCycleSummary] = useState<PartnerCycleSummary | null>(null);

  const partnerFirstName = partner?.display_name?.split(' ')?.[0] ?? (locale === 'en' ? 'your partner' : 'tu pareja');
  const ownName = session?.user.user_metadata?.full_name?.split(' ')?.[0] ?? (locale === 'en' ? 'Me' : 'Yo');

  const weekDays = currentWeekDays();

  const cycleShared = cycleSummary && cycleSummary.visibility !== 'nada' && cycleSummary.has_data ? cycleSummary : null;
  const cycleCareTips = locale === 'en' ? CYCLE_CARE_TIPS_EN : CYCLE_CARE_TIPS_ES;

  useEffect(() => {
    if (!partner?.id) {
      setCycleSummary(null);
      return;
    }
    getPartnerCycleSummary(partner.id)
      .then(setCycleSummary)
      .catch((err) => console.error('No se pudo cargar el resumen de ciclo de la pareja:', err));
  }, [partner?.id]);

  function dayMood(userId: string | undefined, day: Date): MoodCheckin | undefined {
    if (!userId) return undefined;
    const key = toDateKey(day);
    return checkins.find((c) => c.user_id === userId && c.checkin_date === key);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.dateLabel}>
          {formatDayHeader(locale)}
        </ThemedText>

        {/* Card de ánimo de la pareja */}
        <ThemedView
          style={[styles.card, styles.partnerCard, { borderColor: theme.accent800, backgroundColor: theme.accent900 }]}>
          {partnerLatest ? (
            <>
              <View style={styles.rowGap}>
                <View style={[styles.dot, { backgroundColor: theme.accent400 }]} />
                <ThemedText type="small" themeColor="accent300" style={styles.eyebrow}>
                  {partnerFirstName} · {formatRelativeTime(partnerLatest.created_at, t.format)}
                </ThemedText>
              </View>
              <View style={[styles.rowGap, { gap: Spacing.three }]}>
                <View style={[styles.moodBadge, { backgroundColor: theme.accent800 }]}>
                  <ThemedText style={styles.moodBadgeEmoji}>{moodOption(partnerLatest.mood)?.emoji}</ThemedText>
                </View>
                <View>
                  <ThemedText type="subtitle">{moodOption(partnerLatest.mood)?.label}</ThemedText>
                </View>
              </View>
              {partnerLatest.note && (
                <ThemedText type="small" themeColor="neutral200" style={styles.quote}>
                  “{partnerLatest.note}”
                </ThemedText>
              )}
            </>
          ) : (
            <ThemedText themeColor="neutral300">
              {partner ? t.nosotros.partnerNoCheckinYet(partnerFirstName) : t.nosotros.noPartnerYet}
            </ThemedText>
          )}
        </ThemedView>

        {/* Card de check-in propio */}
        <Pressable onPress={() => router.push('/check-in')}>
          <ThemedView style={[styles.card, { borderColor: theme.neutral800, backgroundColor: theme.backgroundElement }]}>
            <View style={styles.spaceBetween}>
              <ThemedText type="subtitle">{t.nosotros.checkInPrompt}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
                {ownToday ? moodOption(ownToday.mood)?.label : t.nosotros.notRegistered}
              </ThemedText>
            </View>
            <View style={styles.moodPreviewRow}>
              {MOOD_OPTIONS.slice()
                .reverse()
                .map((option) => (
                  <View
                    key={option.mood}
                    style={[
                      styles.moodPreviewCell,
                      {
                        borderColor: theme.neutral800,
                        backgroundColor:
                          ownToday?.mood === option.mood ? theme.accent800 : `${theme.accent500}14`,
                      },
                    ]}>
                    <ThemedText style={styles.moodPreviewEmoji}>{option.emoji}</ThemedText>
                  </View>
                ))}
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {t.nosotros.tapToChoose(partnerFirstName)}
            </ThemedText>
          </ThemedView>
        </Pressable>

        {/* Card condicional de ciclo de la pareja — solo si eligió compartir (ver Fase E) */}
        {cycleShared && (
          <ThemedView
            style={[styles.card, { borderColor: theme.accent800, backgroundColor: theme.accent900 }]}>
            {cycleShared.visibility === 'fase_y_avisos' ? (
              <>
                <View style={styles.spaceBetween}>
                  <ThemedText type="small" themeColor="accent300" style={styles.eyebrow}>
                    {t.nosotros.cycleOf(partnerFirstName, t.ciclo.phases[cycleShared.phase])}
                  </ThemedText>
                  <ThemedText type="small" themeColor="neutral400">
                    {t.nosotros.dayOfCycle(cycleShared.day_of_cycle)}
                  </ThemedText>
                </View>
                <ThemedText type="subtitle" themeColor="accent100">
                  {cycleShared.days_until_next_period <= 2
                    ? t.nosotros.cycleArrivingSoon
                    : t.nosotros.cycleArrivingIn(cycleShared.days_until_next_period)}
                </ThemedText>
                <ThemedText themeColor="neutral200">{t.nosotros.cycleCareHint}</ThemedText>
                <ThemedText type="small" themeColor="accent300">
                  {t.nosotros.cycleShared(partnerFirstName)}
                </ThemedText>
              </>
            ) : (
              cycleShared.care_mode && (
                <ThemedText themeColor="accent100">{t.nosotros.cycleCareMode(partnerFirstName)}</ThemedText>
              )
            )}
          </ThemedView>
        )}

        {cycleShared && (
          <View style={styles.cycleCareBlock}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
              {t.nosotros.howToCareForHer}
            </ThemedText>
            {cycleCareTips.map((tip) => (
              <ThemedView key={tip.key} type="backgroundElement" style={styles.cycleCareCard}>
                <ThemedText type="smallBold">{tip.title}</ThemedText>
                <ThemedText type="small" themeColor="neutral300">
                  {tip.body}
                </ThemedText>
              </ThemedView>
            ))}
          </View>
        )}

        {/* Grilla semanal */}
        <ThemedView style={styles.weekBlock}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
            {t.nosotros.week}
          </ThemedText>
          <WeekRow label={ownName} userId={session?.user.id} weekDays={weekDays} dayMood={dayMood} theme={theme} />
          <WeekRow label={partnerFirstName} userId={partner?.id} weekDays={weekDays} dayMood={dayMood} theme={theme} />
          <View style={[styles.weekRow, styles.weekLabelsRow]}>
            {weekDays.map((d) => (
              <ThemedText key={d.toISOString()} type="small" themeColor="neutral500" style={styles.weekdayLetter}>
                {weekdayLetter(d, locale)}
              </ThemedText>
            ))}
          </View>
        </ThemedView>

        {!loading && checkins.length === 0 && !partner && (
          <ThemedText type="small" themeColor="textSecondary">
            {t.nosotros.linkPartnerHint}
          </ThemedText>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function WeekRow({
  label,
  userId,
  weekDays,
  dayMood,
  theme,
}: {
  label: string;
  userId: string | undefined;
  weekDays: Date[];
  dayMood: (userId: string | undefined, day: Date) => MoodCheckin | undefined;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.weekRow}>
      <ThemedText
        type="small"
        themeColor="neutral300"
        numberOfLines={1}
        style={styles.weekRowLabel}>
        {label}
      </ThemedText>
      <View style={styles.weekBars}>
        {weekDays.map((day) => {
          const checkin = dayMood(userId, day);
          return (
            <View
              key={day.toISOString()}
              style={[
                styles.weekBar,
                checkin
                  ? { backgroundColor: `${theme.accent500}${Math.round((checkin.mood / 6) * 255)
                      .toString(16)
                      .padStart(2, '0')}` }
                  : {
                      backgroundColor: 'transparent',
                      borderWidth: 1,
                      borderColor: theme.neutral800,
                      borderStyle: 'dashed',
                    },
              ]}
            />
          );
        })}
      </View>
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
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.four,
  },
  dateLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three + 2,
    gap: Spacing.three,
  },
  partnerCard: {
    gap: Spacing.three,
  },
  rowGap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  moodBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodBadgeEmoji: {
    fontSize: 27,
  },
  quote: {
    borderLeftWidth: 2,
    paddingLeft: Spacing.two,
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  moodPreviewRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  moodPreviewCell: {
    flex: 1,
    height: 46,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodPreviewEmoji: {
    fontSize: 20,
  },
  cycleCareBlock: {
    gap: Spacing.two + 1,
  },
  cycleCareCard: {
    borderRadius: Radius.md,
    padding: Spacing.three - 2,
    gap: 3,
  },
  weekBlock: {
    gap: Spacing.two,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
  },
  weekRowLabel: {
    width: 80,
  },
  weekLabelsRow: {
    marginLeft: 90,
  },
  weekBars: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.one + 2,
  },
  weekBar: {
    flex: 1,
    height: 22,
    borderRadius: 4,
  },
  weekdayLetter: {
    flex: 1,
    textAlign: 'center',
  },
});
