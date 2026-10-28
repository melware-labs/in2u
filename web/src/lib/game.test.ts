import { describe, expect, it } from 'vitest';

import { GAME_QUESTIONS } from '../content/questions';
import type { GameState } from './api';
import { allQuestions, nextQuestion } from './game';

const answered = GAME_QUESTIONS.map((q) => ({
  questionKey: q.key, mySelf: 0, myGuess: 0, partnerAnswered: false, partnerSelf: null, partnerGuess: null,
}));
const extra = { key: 'ia_abc', textEs: '¿Qué fruta eliges?', optionsEs: ['a', 'b', 'c', 'd'], textEn: 'Which fruit?', optionsEn: ['a', 'b', 'c', 'd'] };
const state = (over: Partial<GameState>): GameState => ({ questions: [], myScore: 0, partnerScore: 0, rounds: 0, extraQuestions: [], ...over });

describe('preguntas del juego', () => {
  it('suma las generadas a las fijas y las ofrece al terminar las fijas', () => {
    const s = state({ questions: answered, extraQuestions: [extra] });
    expect(allQuestions(s)).toHaveLength(GAME_QUESTIONS.length + 1);
    expect(nextQuestion(s)?.key).toBe('ia_abc');
  });

  it('no hay próxima pregunta si respondió todas', () => {
    const s = state({ questions: answered });
    expect(nextQuestion(s)).toBeUndefined();
  });
});
