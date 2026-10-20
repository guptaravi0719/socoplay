"use client";

import type { DragEvent } from "react";

export type Suit = "♠" | "♥" | "♦" | "♣";
export type Card = { id: string; suit: Suit; value: number; faceUp: boolean };

export const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
export const isRed = (card: Card) => card.suit === "♥" || card.suit === "♦";

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
      <button disabled={disabled} className={`playing-card card-back ${hinted ? "is-hinted" : ""}`} onClick={onClick} aria-label="Face-down card">
        <b>✦</b>
      </button>
    );
  const royal = card.value > 10;
  const pips = royal ? 0 : card.value;
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
        <span className="royal-face">
          <b>{ranks[card.value - 1]}</b>
          <i>♔</i>
          <small>{card.suit}</small>
        </span>
      ) : (
        <span className={`pips pips-${pips}`}>
          {Array.from({ length: pips }, (_, i) => (
            <i key={i}>{card.suit}</i>
          ))}
        </span>
      )}
      <span className="corner bottom">
        {ranks[card.value - 1]}
        <small>{card.suit}</small>
      </span>
    </button>
  );
}
