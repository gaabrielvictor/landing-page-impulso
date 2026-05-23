import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import "../styles/BirthDatePicker.css";

const MONTHS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const ITEM_HEIGHT = 40;
const WHEEL_PADDING = 80;

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** @param {Date} d */
function toLocalISODate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** @param {string} iso */
function parseLocalDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, day] = iso.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  if (
    d.getFullYear() !== y ||
    d.getMonth() !== m - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

function isoToBR(iso) {
  const d = parseLocalDate(iso);
  if (!d) return "";
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function parseBRToISO(str) {
  const m = str.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const dt = new Date(year, month - 1, day);
  if (
    dt.getFullYear() !== year ||
    dt.getMonth() !== month - 1 ||
    dt.getDate() !== day
  ) {
    return null;
  }
  return toLocalISODate(dt);
}

function dateOnlyTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function isDateInRange(d, minD, maxD) {
  const t = dateOnlyTime(d);
  return t >= dateOnlyTime(minD) && t <= dateOnlyTime(maxD);
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function digitsToDMY(digits) {
  const d = digits.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

function clampDateToRange(d, minD, maxD) {
  const t = dateOnlyTime(d);
  if (t < dateOnlyTime(minD)) return new Date(minD);
  if (t > dateOnlyTime(maxD)) return new Date(maxD);
  return d;
}

function WheelColumn({ columnRef, children, onScrollPick, itemCount }) {
  const handleScroll = (e) => {
    const el = e.target;
    const idx = Math.round(el.scrollTop / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(itemCount - 1, idx));
    onScrollPick(clamped);
  };

  return (
    <div
      ref={columnRef}
      className="bdp-wheel-column"
      onScroll={handleScroll}
    >
      <div
        className="bdp-wheel-pad"
        style={{ height: WHEEL_PADDING }}
        aria-hidden
      />
      {children}
      <div
        className="bdp-wheel-pad"
        style={{ height: WHEEL_PADDING }}
        aria-hidden
      />
    </div>
  );
}

/**
 * @param {{ value: string; onChange: (iso: string) => void; max?: string; min?: string; id?: string; name?: string }} props
 */
const BirthDatePicker = ({ value, onChange, max, min, id, name }) => {
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const dayColRef = useRef(null);
  const monthColRef = useRef(null);
  const yearColRef = useRef(null);
  const skipScrollPick = useRef(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(() => isoToBR(value));

  const [wDay, setWDay] = useState(1);
  const [wMonth, setWMonth] = useState(1);
  const [wYear, setWYear] = useState(2000);

  const maxD = useMemo(() => {
    const d = max ? parseLocalDate(max) : new Date();
    return d || new Date();
  }, [max]);

  const minD = useMemo(() => {
    if (min) {
      const d = parseLocalDate(min);
      if (d) return d;
    }
    const d = new Date();
    d.setFullYear(d.getFullYear() - 110);
    return d;
  }, [min]);

  const yearsDesc = useMemo(() => {
    const a = [];
    for (let y = maxD.getFullYear(); y >= minD.getFullYear(); y -= 1) {
      a.push(y);
    }
    return a;
  }, [minD, maxD]);

  const maxDayInWheel = daysInMonth(wYear, wMonth - 1);
  const safeDay = Math.min(wDay, maxDayInWheel);

  useEffect(() => {
    if (safeDay !== wDay) setWDay(safeDay);
  }, [wYear, wMonth, safeDay, wDay]);

  const syncAllColumns = useCallback(() => {
    skipScrollPick.current = true;
    const dIdx = safeDay - 1;
    const mIdx = wMonth - 1;
    const yIdx = yearsDesc.indexOf(wYear);
    if (dayColRef.current) dayColRef.current.scrollTop = dIdx * ITEM_HEIGHT;
    if (monthColRef.current) monthColRef.current.scrollTop = mIdx * ITEM_HEIGHT;
    if (yearColRef.current && yIdx >= 0) {
      yearColRef.current.scrollTop = yIdx * ITEM_HEIGHT;
    }
    requestAnimationFrame(() => {
      skipScrollPick.current = false;
    });
  }, [safeDay, wMonth, wYear, yearsDesc]);

  const wasModalOpen = useRef(false);
  useLayoutEffect(() => {
    if (modalOpen && !wasModalOpen.current) {
      wasModalOpen.current = true;
      syncAllColumns();
    }
    if (!modalOpen) wasModalOpen.current = false;
  }, [modalOpen, syncAllColumns]);

  const prevYM = useRef({ m: -1, y: -1 });

  useEffect(() => {
    if (!modalOpen) {
      prevYM.current = { m: -1, y: -1 };
      return;
    }
    if (prevYM.current.m === wMonth && prevYM.current.y === wYear) return;
    prevYM.current = { m: wMonth, y: wYear };
    skipScrollPick.current = true;
    const dim = daysInMonth(wYear, wMonth - 1);
    const day = Math.min(wDay, dim);
    if (dayColRef.current) dayColRef.current.scrollTop = (day - 1) * ITEM_HEIGHT;
    const id = requestAnimationFrame(() => {
      skipScrollPick.current = false;
    });
    return () => cancelAnimationFrame(id);
  }, [modalOpen, wMonth, wYear, wDay]);

  useEffect(() => {
    if (inputRef.current === document.activeElement) return;
    setDraft(isoToBR(value));
  }, [value]);

  const confirmWheel = useCallback(() => {
    let d = new Date(wYear, wMonth - 1, safeDay);
    const dim = daysInMonth(wYear, wMonth - 1);
    if (safeDay > dim) d = new Date(wYear, wMonth - 1, dim);
    d = clampDateToRange(d, minD, maxD);
    onChange(toLocalISODate(d));
    setDraft(isoToBR(toLocalISODate(d)));
    setModalOpen(false);
  }, [wYear, wMonth, safeDay, minD, maxD, onChange]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setModalOpen(false);
      if (e.key === "Enter") confirmWheel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen, confirmWheel]);

  const openModal = () => {
    const d = parseLocalDate(value);
    if (d && isDateInRange(d, minD, maxD)) {
      setWDay(d.getDate());
      setWMonth(d.getMonth() + 1);
      setWYear(d.getFullYear());
    } else {
      const def = new Date(maxD);
      def.setFullYear(def.getFullYear() - 18);
      const c = clampDateToRange(def, minD, maxD);
      setWDay(c.getDate());
      setWMonth(c.getMonth() + 1);
      setWYear(c.getFullYear());
    }
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const previewText =
    wYear && wMonth && safeDay
      ? `${safeDay} de ${MONTHS_PT[wMonth - 1]} de ${wYear}`
      : "-- Selecione uma data --";

  const commitDraft = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      onChange("");
      setDraft("");
      return;
    }
    const iso = parseBRToISO(trimmed);
    if (!iso) {
      setDraft(isoToBR(value) || "");
      return;
    }
    const d = parseLocalDate(iso);
    if (!d || !isDateInRange(d, minD, maxD)) {
      setDraft(isoToBR(value) || "");
      return;
    }
    onChange(iso);
    setDraft(isoToBR(iso));
  };

  const toggleCalendarMouse = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
  };

  const scrollItemTo = (colRef, index) => {
    colRef.current?.scrollTo({
      top: index * ITEM_HEIGHT,
      behavior: "smooth",
    });
  };

  const modalNode =
    modalOpen &&
    createPortal(
      <div
        className="bdp-modal active"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        <div
          className="bdp-picker-container"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bdp-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bdp-picker-header">
            <h2 className="bdp-picker-title" id="bdp-modal-title">
              Data de nascimento
            </h2>
            <button
              type="button"
              className="bdp-close-btn"
              aria-label="Fechar"
              onClick={closeModal}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="bdp-selected-date">{previewText}</div>

          <div className="bdp-wheel-picker">
            <div className="bdp-wheel-overlay" aria-hidden />

            <WheelColumn
              columnRef={dayColRef}
              itemCount={maxDayInWheel}
              onScrollPick={(idx) => {
                if (skipScrollPick.current) return;
                setWDay(idx + 1);
              }}
            >
              {Array.from({ length: maxDayInWheel }, (_, i) => {
                const day = i + 1;
                return (
                  <button
                    key={day}
                    type="button"
                    className={`bdp-wheel-item${day === safeDay ? " selected" : ""}`}
                    data-value={day}
                    onClick={() => {
                      setWDay(day);
                      scrollItemTo(dayColRef, i);
                    }}
                  >
                    {pad2(day)}
                  </button>
                );
              })}
            </WheelColumn>

            <WheelColumn
              columnRef={monthColRef}
              itemCount={12}
              onScrollPick={(idx) => {
                if (skipScrollPick.current) return;
                setWMonth(idx + 1);
              }}
            >
              {MONTHS_PT.map((label, i) => {
                const m = i + 1;
                return (
                  <button
                    key={label}
                    type="button"
                    className={`bdp-wheel-item${m === wMonth ? " selected" : ""}`}
                    data-value={m}
                    onClick={() => {
                      setWMonth(m);
                      scrollItemTo(monthColRef, i);
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </WheelColumn>

            <WheelColumn
              columnRef={yearColRef}
              itemCount={yearsDesc.length}
              onScrollPick={(idx) => {
                if (skipScrollPick.current) return;
                const y = yearsDesc[idx];
                if (y !== undefined) setWYear(y);
              }}
            >
              {yearsDesc.map((year, i) => (
                <button
                  key={year}
                  type="button"
                  className={`bdp-wheel-item${year === wYear ? " selected" : ""}`}
                  data-value={year}
                  onClick={() => {
                    setWYear(year);
                    scrollItemTo(yearColRef, i);
                  }}
                >
                  {year}
                </button>
              ))}
            </WheelColumn>
          </div>

          <div className="bdp-action-buttons">
            <button
              type="button"
              className="bdp-btn bdp-btn-cancel"
              onClick={closeModal}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="bdp-btn bdp-btn-confirm"
              onClick={confirmWheel}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <div ref={rootRef} className={`bdp${modalOpen ? " bdp--open" : ""}`}>
      <input type="hidden" name={name} value={value} readOnly />
      <div className="bdp-field">
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          className="bdp-input"
          placeholder="dd/mm/aaaa"
          autoComplete="bday"
          maxLength={10}
          aria-label="Data de nascimento"
          value={draft}
          onChange={(e) => setDraft(digitsToDMY(e.target.value))}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraft();
              inputRef.current?.blur();
            }
          }}
        />
        <button
          type="button"
          className="bdp-calendar-btn"
          aria-expanded={modalOpen}
          aria-haspopup="dialog"
          aria-label="Abrir seletor de data"
          onMouseDown={toggleCalendarMouse}
          onClick={openModal}
        >
          <i className="fas fa-calendar-days" aria-hidden="true" />
        </button>
      </div>
      {modalNode}
    </div>
  );
};

export default BirthDatePicker;
