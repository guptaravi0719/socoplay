"use client";

import type { DragEvent } from "react";

export type Suit = "♠" | "♥" | "♦" | "♣";
export type Card = { id: string; suit: Suit; value: number; faceUp: boolean };

export const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
export const isRed = (card: Card) => card.suit === "♥" || card.suit === "♦";

type PipPosition = { x: number; y: number; flip?: boolean };

const PIP_LAYOUTS: Record<number, PipPosition[]> = {
  1: [{ x: 50, y: 50 }],
  2: [
    { x: 50, y: 14 },
    { x: 50, y: 86, flip: true },
  ],
  3: [
    { x: 50, y: 14 },
    { x: 50, y: 50 },
    { x: 50, y: 86, flip: true },
  ],
  4: [
    { x: 27, y: 14 },
    { x: 73, y: 14 },
    { x: 27, y: 86, flip: true },
    { x: 73, y: 86, flip: true },
  ],
  5: [
    { x: 27, y: 14 },
    { x: 73, y: 14 },
    { x: 50, y: 50 },
    { x: 27, y: 86, flip: true },
    { x: 73, y: 86, flip: true },
  ],
  6: [
    { x: 27, y: 14 },
    { x: 73, y: 14 },
    { x: 27, y: 50 },
    { x: 73, y: 50 },
    { x: 27, y: 86, flip: true },
    { x: 73, y: 86, flip: true },
  ],
  7: [
    { x: 27, y: 12 },
    { x: 73, y: 12 },
    { x: 50, y: 31 },
    { x: 27, y: 50 },
    { x: 73, y: 50 },
    { x: 27, y: 88, flip: true },
    { x: 73, y: 88, flip: true },
  ],
  8: [
    { x: 27, y: 12 },
    { x: 73, y: 12 },
    { x: 50, y: 31 },
    { x: 27, y: 50 },
    { x: 73, y: 50 },
    { x: 50, y: 69, flip: true },
    { x: 27, y: 88, flip: true },
    { x: 73, y: 88, flip: true },
  ],
  9: [
    { x: 27, y: 10 },
    { x: 73, y: 10 },
    { x: 27, y: 37 },
    { x: 73, y: 37 },
    { x: 50, y: 50 },
    { x: 27, y: 63, flip: true },
    { x: 73, y: 63, flip: true },
    { x: 27, y: 90, flip: true },
    { x: 73, y: 90, flip: true },
  ],
  10: [
    { x: 27, y: 10 },
    { x: 73, y: 10 },
    { x: 50, y: 26 },
    { x: 27, y: 37 },
    { x: 73, y: 37 },
    { x: 27, y: 63, flip: true },
    { x: 73, y: 63, flip: true },
    { x: 50, y: 74, flip: true },
    { x: 27, y: 90, flip: true },
    { x: 73, y: 90, flip: true },
  ],
};

function PipField({ card }: { card: Card }) {
  const positions = PIP_LAYOUTS[card.value] ?? [];
  return (
    <span className={`pip-field pip-count-${card.value}`} aria-hidden="true">
      {positions.map((pip, index) => (
        <i
          key={index}
          className={`pip${pip.flip ? " is-flipped" : ""}`}
          style={{ left: `${pip.x}%`, top: `${pip.y}%` }}
        >
          {card.suit}
        </i>
      ))}
    </span>
  );
}

function CourtArt({ rank, suit, mirrored = false }: { rank: string; suit: Suit; mirrored?: boolean }) {
  const king = rank === "K";
  const queen = rank === "Q";
  return (
    <svg
      className={`court-art${mirrored ? " is-mirrored" : ""}`}
      viewBox="0 0 100 70"
      preserveAspectRatio="xMidYMid meet"
      focusable="false"
    >
      <rect
        x="3"
        y="3"
        width="94"
        height="64"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeOpacity=".25"
        strokeWidth=".8"
      />
      <path d="M22 70 C24 52 36 44 50 44 C64 44 76 52 78 70 Z" fill="currentColor" opacity=".14" />
      <path
        d="M22 70 C24 52 36 44 50 44 C64 44 76 52 78 70"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <rect x="46" y="37" width="8" height="9" fill="#f7efdf" stroke="currentColor" strokeWidth=".8" />
      <ellipse
        cx="50"
        cy="27"
        rx="9.5"
        ry="11"
        fill="#fbf5e9"
        stroke="currentColor"
        strokeWidth="1"
      />
      {queen ? (
        <path
          d="M38 27 C36 15 44 11 50 11 C56 11 64 15 62 27 C59 19 54 17 50 17 C46 17 41 19 38 27 Z"
          fill="currentColor"
          opacity=".7"
        />
      ) : (
        <path
          d="M40 24 C40 14 45 11 50 11 C55 11 60 14 60 24 C57 18 53 17 50 17 C47 17 43 18 40 24 Z"
          fill="currentColor"
          opacity=".65"
        />
      )}
      {king ? (
        <path
          d="M38 17 L40 7 L45 13 L50 5 L55 13 L60 7 L62 17 Z"
          fill="#e9c766"
          stroke="currentColor"
          strokeWidth=".9"
          strokeLinejoin="round"
        />
      ) : queen ? (
        <path
          d="M40 17 L42 9 L46 14 L50 7 L54 14 L58 9 L60 17 Z"
          fill="#efd47a"
          stroke="currentColor"
          strokeWidth=".9"
          strokeLinejoin="round"
        />
      ) : (
        <>
          <path d="M40 17 C41 11 45 8 50 8 C55 8 59 11 60 17 Z" fill="currentColor" opacity=".8" />
          <path
            d="M59 12 C64 8 68 4 66 10 C64 14 61 16 60 17"
            fill="currentColor"
            opacity=".6"
          />
        </>
      )}
      <circle cx="46.5" cy="27" r="1" fill="currentColor" />
      <circle cx="53.5" cy="27" r="1" fill="currentColor" />
      <path d="M46.5 32 Q50 35 53.5 32" fill="none" stroke="currentColor" strokeWidth=".8" />
      {king && (
        <path
          d="M42 32 C42 40 46 44 50 44 C54 44 58 40 58 32 C55 37 45 37 42 32 Z"
          fill="currentColor"
          opacity=".75"
        />
      )}
      {queen && (
        <path
          d="M40 26 C38 36 42 42 50 42 C58 42 62 36 60 26"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity=".5"
        />
      )}
      <text
        x="50"
        y="63"
        textAnchor="middle"
        fontSize="13"
        fontFamily="Georgia, serif"
        fill="currentColor"
      >
        {suit}
      </text>
    </svg>
  );
}

export function PlayingCard({
  card,
  selected,
  hinted,
  onClick,
  onDoubleClick,
  draggable,
  onDragStart,
  onDrop,
  delay = 0,
  disabled = false,
}: {
  card?: Card;
  selected?: boolean;
  hinted?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  draggable?: boolean;
  onDragStart?: () => void;
  onDrop?: () => void;
  delay?: number;
  disabled?: boolean;
}) {
  const dragStart = (event: DragEvent<HTMLButtonElement>) => {
    if (!draggable) return;
    event.dataTransfer.effectAllowed = "move";
    onDragStart?.();
  };
  const drop = (event: DragEvent<HTMLButtonElement>) => {
    if (!onDrop) return;
    event.preventDefault();
    onDrop();
  };
  if (!card)
    return (
      <button
        disabled={disabled}
        className={`playing-card card-empty ${hinted ? "is-hinted" : ""}`}
        onClick={onClick}
        onDragOver={(event) => onDrop && event.preventDefault()}
        onDrop={drop}
        aria-label="Empty card position"
      />
    );
  if (!card.faceUp)
    return (
      <button
        disabled={disabled}
        className={`playing-card card-back ${hinted ? "is-hinted" : ""}`}
        onClick={onClick}
        aria-label="Face-down card"
      >
        <b>♠</b>
      </button>
    );
  const royal = card.value > 10;
  return (
    <button
      disabled={disabled}
      draggable={draggable}
      onDragStart={dragStart}
      onDragOver={(event) => onDrop && event.preventDefault()}
      onDrop={drop}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`playing-card ${isRed(card) ? "red" : "black"} ${selected ? "is-selected" : ""} ${hinted ? "is-hinted" : ""}`}
      aria-label={`${ranks[card.value - 1]} of ${card.suit}`}
    >
      <span className="corner top">
        {ranks[card.value - 1]}
        <small>{card.suit}</small>
      </span>
      {royal ? (
        <span className="court-face" aria-hidden="true">
          <CourtArt rank={ranks[card.value - 1]} suit={card.suit} />
          <CourtArt rank={ranks[card.value - 1]} suit={card.suit} mirrored />
        </span>
      ) : (
        <PipField card={card} />
      )}
      <span className="corner bottom">
        {ranks[card.value - 1]}
        <small>{card.suit}</small>
      </span>
    </button>
  );
}
