import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { TIPS_EN, TIPS_ES, tipByKey, weeklyRitual } from '@/content/tips';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { getTodayTip, type DailyTip } from '@/lib/daily-tips';
import { useTranslation } from '@/lib/i18n';

export default function ConsejosScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const { session } = useAuth();
  const [todayTip, setTodayTip] = useState<DailyTip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) return;
    getTodayTip(userId)
      .then(setTodayTip)
      .catch((err) => console.error('No se pudo cargar el tip de hoy:', err))
      .finally(() => setLoading(false));
  }, [session?.user.id]);

  const tips = locale === 'en' ? TIPS_EN : TIPS_ES;
  const featuredTip = todayTip ? tipByKey(todayTip.tip_key, locale) : null;
  const ritual = weeklyRitual(locale);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            {t.consejos.title}
          </ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {!loading && featuredTip && todayTip && (
            <ThemedView
              style={[styles.featuredCard, { borderColor: theme.accent800, backgroundColor: theme.accent900 }]}>
              <ThemedText type="small" themeColor="accent300" style={styles.eyebrow}>
                {t.consejos.forToday} · {todayTip.kicker_text}
              </ThemedText>
              <ThemedText type="subtitle" themeColor="accent100">
                {featuredTip.title}
              </ThemedText>
              <ThemedText themeColor="neutral200" style={styles.featuredBody}>
                {featuredTip.body}
              </ThemedText>
              <ThemedText type="small" themeColor="accent300">
                {featuredTip.attribution}
              </ThemedText>
            </ThemedView>
          )}

          <View style={styles.tipList}>
            {tips.map((tip) => (
              <ThemedView key={tip.key} type="backgroundElement" style={styles.tipCard}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
                  {tip.kicker}
                </ThemedText>
                <ThemedText type="smallBold">{tip.title}</ThemedText>
                <ThemedText type="small" themeColor="neutral300">
                  {tip.body}
                </ThemedText>
              </ThemedView>
            ))}
          </View>

          <View style={[styles.ritualRow, { borderColor: theme.neutral900 }]}>
            <View style={styles.ritualText}>
              <ThemedText>
                {t.consejos.ritualOfWeek} {ritual.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {ritual.subtitle}
              </ThemedText>
            </View>
          </View>
        </ScrollView>
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
  featuredCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three + 2,
    gap: Spacing.two,
  },
  featuredBody: {
    lineHeight: 21,
  },
  tipList: {
    gap: Spacing.two + 1,
  },
  tipCard: {
    borderRadius: Radius.md,
    padding: Spacing.three - 2,
    gap: 3,
  },
  ritualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderTopWidth: 1,
    paddingTop: Spacing.three,
  },
  ritualText: {
    flex: 1,
    gap: 2,
  },
});
