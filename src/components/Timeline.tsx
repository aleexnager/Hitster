import { Fragment } from 'react';
import type { Song } from '../game/types';
import { SongCard } from './SongCard';

export interface SlotMark {
  slot: number;
  label: string;
  color: string;
}

interface Props {
  cards: Song[];
  selectable?: boolean;
  selectedSlot?: number | null;
  onSelect?: (slot: number) => void;
  marks?: SlotMark[];
  /** En la revelación: huecos correctos y el elegido. */
  correctSlots?: number[];
  revealSlot?: number | null;
  newCardId?: string | null;
}

export function Timeline({ cards, selectable, selectedSlot, onSelect, marks = [], correctSlots, revealSlot, newCardId }: Props) {
  const slot = (i: number) => {
    const isSelected = selectedSlot === i;
    const slotMarks = marks.filter((m) => m.slot === i);
    const classes = ['slot'];
    if (selectable) classes.push('selectable');
    if (isSelected) classes.push('selected');
    if (correctSlots?.includes(i)) classes.push('correct');
    else if (revealSlot === i || (correctSlots && slotMarks.length)) classes.push('wrong');
    return (
      <button
        key={`slot-${i}`}
        type="button"
        className={classes.join(' ')}
        disabled={!selectable}
        onClick={() => onSelect?.(i)}
        aria-label={`Colocar en la posición ${i + 1}`}
      >
        {isSelected ? '?' : selectable ? '+' : ''}
        {slotMarks.map((m) => (
          <span key={m.label} className="mark" style={{ background: m.color }}>
            {m.label}
          </span>
        ))}
      </button>
    );
  };

  if (!cards.length && !selectable) {
    return <p className="empty-timeline muted">Sin cartas todavía</p>;
  }

  return (
    <div className="timeline">
      {slot(0)}
      {cards.map((c, i) => (
        <Fragment key={c.id}>
          <SongCard song={c} isNew={c.id === newCardId} />
          {slot(i + 1)}
        </Fragment>
      ))}
    </div>
  );
}
