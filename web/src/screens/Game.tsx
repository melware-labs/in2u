import { useEffect, useState } from 'react';

import { api, type GameQuestionState, type GameState, type Me } from '../api';
import { t } from '../i18n';
import { firstName } from '../lib';
import { GAME_QUESTIONS, type GameQuestion, gameQuestion } from '../questions';

/** La próxima pregunta sin responder; primero las que la pareja ya contestó. */
export function nextQuestion(state: GameState | null): GameQuestion | undefined {
  const byKey = new Map(state?.questions.map((q) => [q.questionKey, q]));
  const open = GAME_QUESTIONS.filter((q) => byKey.get(q.key)?.mySelf == null);
  return open.find((q) => byKey.get(q.key)?.partnerAnswered) ?? open[0];
}

function Options({
  question,
  value,
  onChange,
  label,
}: {
  question: GameQuestion;
  value: number | null;
  onChange: (i: number) => void;
  label: string;
}) {
  return (
    <div className="stack" style={{ gap: 8 }} role="radiogroup" aria-label={label}>
      <p className="kicker">{label}</p>
      {question.options.map((option, i) => (
        <button
          key={option}
          role="radio"
          aria-checked={value === i}
          className="mood-option"
          onClick={() => onChange(i)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function Result({ state, partner }: { state: GameQuestionState; partner: string }) {
  const q = gameQuestion(state.questionKey);
  if (!q || state.partnerSelf == null || state.mySelf == null) return null;
  const iGuessed = state.myGuess === state.partnerSelf;
  const theyGuessed = state.partnerGuess === state.mySelf;
  return (
    <article className="card">
      <h2>{q.text}</h2>
      <p className="small">
        <span className="muted">{t.juego.partnerAnswer(partner)}: </span>
        <strong>{q.options[state.partnerSelf]}</strong> <span className={`mark ${iGuessed ? 'ok' : 'ko'}`}>{iGuessed ? '✓' : '✗'}</span>
      </p>
      <p className="small">
        <span className="muted">{t.juego.yourAnswer}: </span>
        <strong>{q.options[state.mySelf]}</strong> <span className={`mark ${theyGuessed ? 'ok' : 'ko'}`}>{theyGuessed ? '✓' : '✗'}</span>
      </p>
    </article>
  );
}

export function Game({ me, version }: { me: Me; version: number }) {
  const partner = firstName(me.partner?.name, '—');
  const [state, setState] = useState<GameState | null>(null);
  const [self, setSelf] = useState<number | null>(null);
  const [guess, setGuess] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** La pregunta recién respondida, para mostrar el resultado antes de pasar a la siguiente. */
  const [justAnswered, setJustAnswered] = useState<string | null>(null);

  useEffect(() => {
    api.game().then(setState, () => undefined);
  }, [version]);

  const question = nextQuestion(state);
  const current = state?.questions.find((q) => q.questionKey === question?.key);
  const revealed = (state?.questions ?? []).filter((q) => q.partnerSelf != null && q.mySelf != null);
  const waiting = (state?.questions ?? []).filter((q) => q.mySelf != null && !q.partnerAnswered).length;
  const last = state?.questions.find((q) => q.questionKey === justAnswered);

  async function submit() {
    if (!question || self === null || guess === null) return;
    setSending(true);
    setError(null);
    try {
      setState(await api.answerGame(question.key, self, guess));
      setJustAnswered(question.key);
      setSelf(null);
      setGuess(null);
    } catch {
      setError(t.error);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <header className="stack" style={{ gap: 4 }}>
        <h1>{t.juego.title}</h1>
        <p className="muted">{t.juego.subtitle(partner)}</p>
      </header>

      <div className="cols">
        <div className="col">
          <section className="card coral score">
            <div>
              <p className="kicker">{t.juego.youGuessed(partner)}</p>
              <p className="score-num">{t.juego.scoreLine(state?.myScore ?? 0, state?.rounds ?? 0)}</p>
            </div>
            <div>
              <p className="kicker">{t.juego.partnerGuessed(partner)}</p>
              <p className="score-num">{t.juego.scoreLine(state?.partnerScore ?? 0, state?.rounds ?? 0)}</p>
            </div>
          </section>

          {last && last.partnerSelf != null ? (
            <>
              <Result state={last} partner={partner} />
              <button className="btn" onClick={() => setJustAnswered(null)}>
                {t.juego.next}
              </button>
            </>
          ) : question ? (
            <section className="card stack">
              {justAnswered && <p className="muted small">{t.juego.waiting(partner)}</p>}
              {current?.partnerAnswered && <span className="pill tag">{t.juego.partnerWaiting(partner)}</span>}
              <h2 className="question">{question.text}</h2>
              <Options question={question} value={self} onChange={setSelf} label={t.juego.aboutYou} />
              <Options question={question} value={guess} onChange={setGuess} label={t.juego.guessPartner(partner)} />
              {error && <p className="error">{error}</p>}
              <button className="btn" disabled={self === null || guess === null || sending} onClick={submit}>
                {t.juego.submit}
              </button>
            </section>
          ) : (
            state && (
              <section className="card">
                <p>{t.juego.allDone}</p>
              </section>
            )
          )}
          {waiting > 0 && <p className="muted small">{t.juego.waiting(partner)} ({waiting})</p>}
        </div>

        {revealed.length > 0 && (
          <div className="col">
            <p className="kicker">{t.juego.results}</p>
            {[...revealed].reverse().map((q) => (
              <Result key={q.questionKey} state={q} partner={partner} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
