import { useEffect, useRef, useState } from 'react';

import type { GameQuestion } from '../content/questions';
import { api, type GameQuestionState, type GameState, type Me } from '../lib/api';
import { allQuestions, nextQuestion } from '../lib/game';
import { t } from '../lib/i18n';
import { firstName } from '../lib/text';

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

function Verdict({ ok, label, correct }: { ok: boolean; label: string; correct?: string }) {
  return (
    <p className={`verdict ${ok ? 'ok' : 'ko'}`} role="status">
      <span className="mark">{ok ? '✓' : '✗'}</span> {label}
      {!ok && correct && <span className="muted"> · {correct}</span>}
    </p>
  );
}

function Result({ q, state, partner }: { q: GameQuestion; state: GameQuestionState; partner: string }) {
  if (state.partnerSelf == null || state.mySelf == null) return null;
  const iGuessed = state.myGuess === state.partnerSelf;
  const theyGuessed = state.partnerGuess === state.mySelf;
  return (
    <article className="card">
      <h2>{q.text}</h2>
      <div className="stack" style={{ gap: 4 }}>
        <p className="small">
          <span className="muted">{t.juego.partnerAnswer(partner)}: </span>
          <strong>{q.options[state.partnerSelf]}</strong>
        </p>
        <p className="small muted">
          {t.juego.yourGuess}: {q.options[state.myGuess ?? 0]}
        </p>
        <Verdict ok={iGuessed} label={iGuessed ? t.juego.right : t.juego.wrong} correct={q.options[state.partnerSelf]} />
      </div>
      <div className="stack" style={{ gap: 4 }}>
        <p className="small">
          <span className="muted">{t.juego.yourAnswer}: </span>
          <strong>{q.options[state.mySelf]}</strong>
        </p>
        <p className="small muted">
          {t.juego.partnerGuess(partner)}: {q.options[state.partnerGuess ?? 0]}
        </p>
        <Verdict
          ok={theyGuessed}
          label={theyGuessed ? t.juego.partnerRight(partner) : t.juego.partnerWrong(partner)}
        />
      </div>
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
  const [loadingMore, setLoadingMore] = useState(false);
  /** La pregunta recién respondida, para mostrar el resultado antes de pasar a la siguiente. */
  const [justAnswered, setJustAnswered] = useState<string | null>(null);

  useEffect(() => {
    api.game().then(setState, () => undefined);
  }, [version]);

  const questions = allQuestions(state);
  const question = nextQuestion(state);
  const current = state?.questions.find((q) => q.questionKey === question?.key);
  const revealed = (state?.questions ?? []).filter((q) => q.partnerSelf != null && q.mySelf != null);
  const waiting = (state?.questions ?? []).filter((q) => q.mySelf != null && !q.partnerAnswered).length;
  const last = state?.questions.find((q) => q.questionKey === justAnswered);
  const lastQuestion = questions.find((q) => q.key === justAnswered);

  // Al terminar todas las preguntas, el backend agrega un lote nuevo de 10.
  // Se pide una vez por cantidad de preguntas, para no insistir si no hay más.
  const askedAt = useRef(-1);
  const finished = state != null && !question && justAnswered == null;
  useEffect(() => {
    if (!finished || askedAt.current === questions.length) return;
    askedAt.current = questions.length;
    setLoadingMore(true);
    api.moreGameQuestions().then(setState, () => undefined).finally(() => setLoadingMore(false));
  }, [finished, questions.length]);

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

          {last && lastQuestion && last.mySelf != null && last.partnerSelf == null ? (
            <>
              <section className="card stack">
                <h2>{lastQuestion.text}</h2>
                <p className="small">
                  <span className="muted">{t.juego.yourAnswer}: </span>
                  <strong>{lastQuestion.options[last.mySelf]}</strong>
                </p>
                <p className="muted small">{t.juego.verdictPending(partner)}</p>
              </section>
              <button className="btn" onClick={() => setJustAnswered(null)}>
                {t.juego.next}
              </button>
            </>
          ) : last && lastQuestion && last.partnerSelf != null ? (
            <>
              <Result q={lastQuestion} state={last} partner={partner} />
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
                <p>{loadingMore ? t.juego.loadingMore : t.juego.allDone}</p>
              </section>
            )
          )}
          {waiting > 0 && <p className="muted small">{t.juego.waiting(partner)} ({waiting})</p>}
        </div>

        {revealed.length > 0 && (
          <div className="col">
            <p className="kicker">{t.juego.results}</p>
            {[...revealed].reverse().map((r) => {
              const q = questions.find((x) => x.key === r.questionKey);
              return q && <Result key={r.questionKey} q={q} state={r} partner={partner} />;
            })}
          </div>
        )}
      </div>
    </>
  );
}
