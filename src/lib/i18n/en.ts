import type { Dictionary } from './es';

/** Mismo shape que `es.ts` (`Dictionary`), chequeado en compile-time. */
export const en: Dictionary = {
  tabs: {
    nosotros: 'Us',
    calendario: 'Calendar',
    consejos: 'Tips',
    ciclo: 'Cycle',
    perfil: 'Profile',
  },

  format: {
    justNow: 'just now',
    minutesAgo: (n) => `${n} min ago`,
    hoursAgo: (n) => `${n} h ago`,
    daysAgo: (n) => `${n} d ago`,
  },

  nosotros: {
    linkPartnerHint: 'Link your partner from your profile to start sharing your daily mood.',
    partnerNoCheckinYet: (partner) => `${partner} hasn't logged their mood today yet.`,
    noPartnerYet: "You don't have a partner linked yet.",
    checkInPrompt: 'How are you today?',
    notRegistered: 'not logged',
    tapToChoose: (partner) => `Tap to choose — ${partner} sees it instantly.`,
    week: 'This week',
    howToCareForHer: 'How to take care of her these days',
    cycleOf: (partner, phase) => `${partner}'s cycle · ${phase}`,
    dayOfCycle: (n) => `day ${n}`,
    cycleArrivingSoon: 'Her period could start any time now',
    cycleArrivingIn: (n) => `Her period could start in ${n} days`,
    cycleCareHint: "These days she usually has less energy and sleeps worse. It's not her mood: it's the cycle.",
    cycleShared: (partner) => `${partner} chose to share this phase with you`,
    cycleCareMode: (partner) => `Take a little extra care of ${partner} these days.`,
  },

  checkIn: {
    cancel: 'Cancel',
    onePerDay: '1 per day',
    title: 'How are you\ntoday?',
    chosen: 'chosen',
    noteOptional: 'Note — optional',
    notePlaceholder: (partner) => `A line for ${partner}…`,
    shareWith: (partner) => `Share with ${partner}`,
    deliveredNow: 'It reaches them now, even with the app closed.',
    saveError: "Couldn't save the check-in.",
  },

  calendario: {
    month: 'Month',
    agenda: 'Agenda',
    you: 'Me',
    bothOfUs: 'Both of us',
    noEvents: 'No events.',
    noEventsInRange: (days) => `No events in the next ${days} days.`,
  },

  newEvent: {
    new: 'New',
    titlePlaceholder: 'Event title',
    when: 'When',
    duration: 'Duration',
    repeat: 'Repeat',
    never: 'Never',
    visibleFor: 'Visible to',
    onlyMe: 'Only me',
    bothOfUs: 'Both of us',
    partnerSeesIt: (partner) => `${partner} sees it on their calendar.`,
    onlyYouSeeIt: "Only you'll see it.",
    googleCalendar: 'Google Calendar',
    googleSyncHint: (email) => `Also write it to ${email}`,
    googleSyncHintGeneric: 'Also write it to your Google Calendar',
    save: 'Save event',
    saving: 'Saving…',
    saveError: "Couldn't save the event.",
  },

  consejos: {
    title: 'Tips',
    forToday: 'For today',
    ritualOfWeek: 'This week\'s ritual —',
  },

  ciclo: {
    title: 'Cycle',
    notRegisteredYet: "You haven't logged your last period yet.",
    startedToday: 'Started today',
    logAgain: 'Did it start today? Log it',
    registerToday: 'Log today',
    nextPeriod: 'Next period',
    inDays: (n) => `in ${n} ${n === 1 ? 'day' : 'days'}`,
    fertileWindow: 'Fertile window',
    whatPartnerSees: (partner) => `What ${partner} sees`,
    privacyHint: 'They never see the detail you log — only the phase and alerts you choose to share.',
    disclaimer: "Estimated from your cycle's average length. Not a contraceptive method.",
    phases: {
      menstrual: 'Period',
      folicular: 'Follicular phase',
      ovulacion: 'Ovulation',
      lutea: 'Luteal phase',
    },
    symptoms: {
      dolor: 'Pain',
      sangrado: 'Bleeding',
      sin_energia: 'Low energy',
      antojos: 'Cravings',
      insomnio: 'Insomnia',
    },
    visibility: {
      nada: 'Nothing',
      avisos: 'Alerts only',
      fase_y_avisos: 'Phase and alerts',
    },
  },

  perfil: {
    title: 'Profile',
    account: 'Account',
    coupleCode: 'Partner code',
    signOut: 'Sign out',
  },
};
