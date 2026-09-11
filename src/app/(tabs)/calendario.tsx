import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import {
  buildMonthGrid,
  eventBadgeKind,
  getMonthGridRange,
  groupEventsByDay,
  type CalendarDayCell,
} from '@/lib/calendar-grid';
import { listEventsInRange, type CoupleEvent } from '@/lib/couple-events';
import { INTL_LOCALE, toDateKey, weekdayLetter } from '@/lib/format';
import { useTranslation } from '@/lib/i18n';

const AGENDA_DAYS_AHEAD = 30;

export default function CalendarioScreen() {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const { session, couple, partner } = useAuth();
  const ownUserId = session?.user.id;

  const [mode, setMode] = useState<'mes' | 'agenda'>('mes');
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));
  const [events, setEvents] = useState<CoupleEvent[]>([]);
  const [agendaEvents, setAgendaEvents] = useState<CoupleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();

  const loadMonth = useCallback(async () => {
    if (!couple) return;
    const { start, end } = getMonthGridRange(year, month);
    try {
      const data = await listEventsInRange(couple.id, start, end);
      setEvents(data);
    } catch (err) {
      console.error('No se pudieron cargar los eventos del mes:', err);
    } finally {
      setLoading(false);
    }
  }, [couple, year, month]);

  const loadAgenda = useCallback(async () => {
    if (!couple) return;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + AGENDA_DAYS_AHEAD);
    try {
      const data = await listEventsInRange(couple.id, start, end);
      setAgendaEvents(data);
    } catch (err) {
      console.error('No se pudo cargar la agenda:', err);
    } finally {
      setLoading(false);
    }
  }, [couple]);

  useEffect(() => {
    setLoading(true);
    if (mode === 'mes') loadMonth();
    else loadAgenda();
  }, [mode, loadMonth, loadAgenda]);

  const grid = useMemo(
    () => buildMonthGrid({ year, month, events, ownUserId, selectedDateKey }),
    [year, month, events, ownUserId, selectedDateKey]
  );

  const weekdayLetters = useMemo(() => {
    // L-D (o M-S en inglés): reutiliza weekdayLetter() desplazado a lunes-primero.
    return Array.from({ length: 7 }, (_, i) => weekdayLetter(new Date(2024, 0, 1 + i), locale));
  }, [locale]);

  const selectedDayEvents = useMemo(() => {
    const byDay = groupEventsByDay(events);
    return byDay.get(selectedDateKey) ?? [];
  }, [events, selectedDateKey]);

  const agendaByDay = useMemo(() => {
    const byDay = groupEventsByDay(agendaEvents);
    return [...byDay.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
  }, [agendaEvents]);

  const partnerFirstName = partner?.display_name?.split(' ')?.[0] ?? (locale === 'en' ? 'your partner' : 'tu pareja');
  const intlLocale = INTL_LOCALE[locale];
  const monthLabel = monthCursor
    .toLocaleDateString(intlLocale, { month: 'long', year: 'numeric' })
    .replace(/^\w/, (c) => c.toUpperCase());

  function changeMonth(delta: number) {
    setMonthCursor((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          {mode === 'mes' ? (
            <View style={styles.monthNav}>
              <Pressable hitSlop={8} onPress={() => changeMonth(-1)}>
                <ThemedText themeColor="textSecondary">‹</ThemedText>
              </Pressable>
              <ThemedText type="title" style={styles.title}>
                {monthLabel}
              </ThemedText>
              <Pressable hitSlop={8} onPress={() => changeMonth(1)}>
                <ThemedText themeColor="textSecondary">›</ThemedText>
              </Pressable>
            </View>
          ) : (
            <ThemedText type="title" style={styles.title}>
              {t.calendario.agenda}
            </ThemedText>
          )}
          <Pressable
            hitSlop={8}
            onPress={() => router.push('/new-event')}
            style={[styles.addButton, { borderColor: theme.accent700 }]}>
            <ThemedText themeColor="accent300" type="smallBold">
              +
            </ThemedText>
          </Pressable>
        </View>

        <View style={[styles.segmented, { borderColor: theme.neutral800 }]}>
          {(['mes', 'agenda'] as const).map((option) => (
            <Pressable key={option} style={styles.segmentedOpt} onPress={() => setMode(option)}>
              <ThemedView
                type={mode === option ? 'backgroundSelected' : undefined}
                style={styles.segmentedOptInner}>
                <ThemedText
                  type="small"
                  themeColor={mode === option ? 'accent100' : 'textSecondary'}
                  style={styles.segmentedLabel}>
                  {option === 'mes' ? t.calendario.month : t.calendario.agenda}
                </ThemedText>
              </ThemedView>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {mode === 'mes' ? (
            <>
              <View style={styles.weekdayRow}>
                {weekdayLetters.map((letter, i) => (
                  <ThemedText key={`${letter}-${i}`} type="small" themeColor="neutral500" style={styles.weekdayLetter}>
                    {letter}
                  </ThemedText>
                ))}
              </View>

              <View style={styles.grid}>
                {grid.map((cell) => (
                  <DayCell key={cell.dateKey} cell={cell} onPress={() => setSelectedDateKey(cell.dateKey)} />
                ))}
              </View>

              <View style={styles.legend}>
                <LegendItem theme={theme} kind="solid" label={t.calendario.you} />
                <LegendItem theme={theme} kind="bordered" label={partnerFirstName} />
                <LegendItem theme={theme} kind="pill" label={t.calendario.bothOfUs} />
              </View>

              <View style={styles.agendaBlock}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
                  {new Date(selectedDateKey).toLocaleDateString(intlLocale, { weekday: 'long', day: 'numeric' })}
                </ThemedText>
                {selectedDayEvents.length === 0 && !loading && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {t.calendario.noEvents}
                  </ThemedText>
                )}
                {selectedDayEvents.map((event) => (
                  <EventRow key={event.id} event={event} ownUserId={ownUserId} theme={theme} intlLocale={intlLocale} />
                ))}
              </View>
            </>
          ) : (
            <View style={styles.agendaList}>
              {agendaByDay.length === 0 && !loading && (
                <ThemedText type="small" themeColor="textSecondary">
                  {t.calendario.noEventsInRange(AGENDA_DAYS_AHEAD)}
                </ThemedText>
              )}
              {agendaByDay.map(([dateKey, dayEvents]) => (
                <View key={dateKey} style={styles.agendaDayBlock}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
                    {new Date(dateKey).toLocaleDateString(intlLocale, { weekday: 'long', day: 'numeric', month: 'short' })}
                  </ThemedText>
                  {dayEvents.map((event) => (
                    <EventRow key={event.id} event={event} ownUserId={ownUserId} theme={theme} intlLocale={intlLocale} />
                  ))}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function DayCell({ cell, onPress }: { cell: CalendarDayCell; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.dayCellWrap}>
      <View
        style={[
          styles.dayCell,
          {
            backgroundColor: cell.isSelected ? theme.accent900 : 'transparent',
            borderColor: cell.isSelected ? theme.accent600 : 'transparent',
          },
        ]}>
        <ThemedText
          type="small"
          themeColor={!cell.inCurrentMonth ? 'neutral700' : cell.isSelected ? 'accent100' : 'text'}>
          {cell.date.getDate()}
        </ThemedText>
        <View style={styles.dayCellDots}>
          {cell.badges.solid && <View style={[styles.dotSolid, { backgroundColor: theme.accent400 }]} />}
          {cell.badges.bordered && <View style={[styles.dotBordered, { borderColor: theme.accent400 }]} />}
          {cell.badges.pill && <View style={[styles.dotPill, { backgroundColor: theme.accent200 }]} />}
        </View>
      </View>
    </Pressable>
  );
}

function LegendItem({
  theme,
  kind,
  label,
}: {
  theme: ReturnType<typeof useTheme>;
  kind: 'solid' | 'bordered' | 'pill';
  label: string;
}) {
  return (
    <View style={styles.legendItem}>
      {kind === 'solid' && <View style={[styles.dotSolid, { backgroundColor: theme.accent400 }]} />}
      {kind === 'bordered' && <View style={[styles.dotBordered, { borderColor: theme.accent400 }]} />}
      {kind === 'pill' && <View style={[styles.dotPill, { backgroundColor: theme.accent200 }]} />}
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
        {label}
      </ThemedText>
    </View>
  );
}

function EventRow({
  event,
  ownUserId,
  theme,
  intlLocale,
}: {
  event: CoupleEvent;
  ownUserId: string | undefined;
  theme: ReturnType<typeof useTheme>;
  intlLocale: string;
}) {
  const kind = eventBadgeKind(event, ownUserId);
  const time = new Date(event.starts_at).toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' });

  if (kind === 'pill') {
    return (
      <View style={[styles.eventPillRow, { borderColor: theme.accent700, backgroundColor: theme.accent900 }]}>
        <ThemedText type="small" themeColor="accent200" style={styles.eventTime}>
          {time}
        </ThemedText>
        <ThemedText themeColor="accent100">{event.title}</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.eventRow}>
      <ThemedText type="small" themeColor="neutral300" style={styles.eventTime}>
        {time}
      </ThemedText>
      <View
        style={[
          styles.eventBar,
          { borderColor: kind === 'solid' ? theme.accent400 : `${theme.accent400}72` },
        ]}>
        <ThemedText>{event.title}</ThemedText>
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
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingVertical: 7,
    alignItems: 'center',
  },
  segmentedLabel: {
    fontSize: 13,
  },
  scrollContent: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayLetter: {
    flex: 1,
    textAlign: 'center',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellWrap: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  dayCell: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dayCellDots: {
    flexDirection: 'row',
    gap: 3,
    height: 5,
  },
  dotSolid: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dotBordered: {
    width: 5,
    height: 5,
    borderRadius: 3,
    borderWidth: 1,
  },
  dotPill: {
    width: 10,
    height: 5,
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.four,
    paddingTop: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  agendaBlock: {
    gap: Spacing.two,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  agendaList: {
    gap: Spacing.four,
  },
  agendaDayBlock: {
    gap: Spacing.two,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  eventTime: {
    width: 42,
    paddingTop: 2,
  },
  eventBar: {
    flex: 1,
    borderLeftWidth: 2,
    paddingLeft: Spacing.two,
    paddingVertical: 2,
  },
  eventPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.two,
    paddingLeft: Spacing.three - 4,
  },
});
