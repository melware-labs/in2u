import { GAME_QUESTIONS, type GameQuestion } from '../content/questions';
import type { GameState } from './api';

/** La próxima pregunta sin responder; primero las que la pareja ya contestó. */
export function nextQuestion(state: GameState | null): GameQuestion | undefined {
  const byKey = new Map(state?.questions.map((q) => [q.questionKey, q]));
  const open = GAME_QUESTIONS.filter((q) => byKey.get(q.key)?.mySelf == null);
  return open.find((q) => byKey.get(q.key)?.partnerAnswered) ?? open[0];
}
