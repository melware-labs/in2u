import { GAME_QUESTIONS, type GameQuestion } from '../content/questions';
import { locale } from './i18n';
import type { GameState } from './api';

/** Las 20 fijas más las que se generaron para la pareja, en el idioma actual. */
export function allQuestions(state: GameState | null): GameQuestion[] {
  const extra = (state?.extraQuestions ?? []).map((q): GameQuestion => {
    const en = locale === 'en';
    return { key: q.key, text: en ? q.textEn : q.textEs, options: (en ? q.optionsEn : q.optionsEs) as GameQuestion['options'] };
  });
  return [...GAME_QUESTIONS, ...extra];
}

/** La próxima pregunta sin responder; primero las que la pareja ya contestó. */
export function nextQuestion(state: GameState | null): GameQuestion | undefined {
  const byKey = new Map(state?.questions.map((q) => [q.questionKey, q]));
  const open = allQuestions(state).filter((q) => byKey.get(q.key)?.mySelf == null);
  return open.find((q) => byKey.get(q.key)?.partnerAnswered) ?? open[0];
}
