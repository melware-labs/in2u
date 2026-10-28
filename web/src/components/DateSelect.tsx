import { useEffect, useState } from 'react';

import { daysInMonth } from '../lib/dates';
import { locale, t } from '../lib/i18n';

/**
 * Fecha con tres listas (día, mes, año) en vez de <input type="date">: el
 * selector nativo falla en algunos celulares y obliga a pasar año por año
 * para llegar a una fecha de nacimiento. value/onChange usan "YYYY-MM-DD" o ''
 * mientras falte alguna parte.
 */
export function DateSelect({
  label,
  value,
  onChange,
  minYear,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minYear: number;
  /** "YYYY-MM-DD": no se ofrecen fechas posteriores. */
  max: string;
}) {
  const [y0, m0, d0] = value ? value.split('-').map(Number) : [0, 0, 0];
  const [year, setYear] = useState(y0);
  const [month, setMonth] = useState(m0);
  const [day, setDay] = useState(d0);
  const [maxY, maxM, maxD] = max.split('-').map(Number);

  // Si el valor cambia desde afuera (p. ej. al abrir la edición), se refleja.
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      setYear(y);
      setMonth(m);
      setDay(d);
    }
  }, [value]);

  const lastMonth = year === maxY ? maxM : 12;
  const lastDay = Math.min(
    year && month ? daysInMonth(year, month) : 31,
    year === maxY && month === maxM ? maxD : 31,
  );

  function update(y: number, m: number, d: number) {
    const mm = m > (y === maxY ? maxM : 12) ? 0 : m;
    const dd = y && mm && d > Math.min(daysInMonth(y, mm), y === maxY && mm === maxM ? maxD : 31) ? 0 : d;
    setYear(y);
    setMonth(mm);
    setDay(dd);
    onChange(y && mm && dd ? `${y}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}` : '');
  }

  const years: number[] = [];
  for (let y = maxY; y >= minYear; y--) years.push(y);
  const monthName = (m: number) =>
    new Date(2000, m - 1, 1).toLocaleDateString(locale, { month: 'long' });

  return (
    <div className="stack" role="group" aria-label={label} style={{ gap: 6 }}>
      <span className="kicker">{label}</span>
      <div className="date-select">
        <select className="input" aria-label={t.date.day} value={day} onChange={(e) => update(year, month, Number(e.target.value))}>
          <option value={0} disabled>
            {t.date.day}
          </option>
          {Array.from({ length: lastDay }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select className="input" aria-label={t.date.month} value={month} onChange={(e) => update(year, Number(e.target.value), day)}>
          <option value={0} disabled>
            {t.date.month}
          </option>
          {Array.from({ length: lastMonth }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {monthName(m)}
            </option>
          ))}
        </select>
        <select className="input" aria-label={t.date.year} value={year} onChange={(e) => update(Number(e.target.value), month, day)}>
          <option value={0} disabled>
            {t.date.year}
          </option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
