import type { Card, Suit } from "../../components/playing-card";

export type SpiderDifficulty = 1 | 2 | 4;

export type SpiderGame = {
  stock: Card[];
  tableau: Card[][];
  completed: Card[][];
  moves: number;
  score: number;
  deals: number;
  difficulty: SpiderDifficulty;
};

export type SpiderPick = { column: number; index: number };

export type SpiderHint =
  | { kind: "move"; from: SpiderPick; to: number; text: string }
  | { kind: "deal"; text: string }
  | null;

export const SPIDER_COLUMNS = 10;
export const SPIDER_DEAL_SIZE = 10;
export const SPIDER_COMPLETE_COUNT = 8;

const suitsFor: Record<SpiderDifficulty, Suit[]> = {
  1: ["♠"],
  2: ["♠", "♥"],
  4: ["♠", "♥", "♦", "♣"],
};

function shuffledDeck(difficulty: SpiderDifficulty, seed: number) {
  const suits = suitsFor[difficulty];
  const copies = 8 / suits.length;
  const deck: Card[] = [];
  let id = 0;
  for (let copy = 0; copy < copies; copy += 1) {
    for (const suit of suits) {
      for (let value = 1; value <= 13; value += 1) {
        deck.push({ id: `${difficulty}-${copy}-${suit}-${value}-${id}`, suit, value, faceUp: false });
        id += 1;
      }
    }
  }
  let state = seed >>> 0;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [deck[index], deck[swap]] = [deck[swap], deck[index]];
  }
  return deck;
}

export function newSpiderGame(difficulty: SpiderDifficulty, seed = Date.now()): SpiderGame {
  const deck = shuffledDeck(difficulty, seed);
  const tableau: Card[][] = Array.from({ length: SPIDER_COLUMNS }, () => []);
  for (let column = 0; column < SPIDER_COLUMNS; column += 1) {
    const count = column < 4 ? 6 : 5;
    for (let row = 0; row < count; row += 1) {
      const card = deck.pop();
      if (!card) break;
      card.faceUp = row === count - 1;
      tableau[column].push(card);
    }
  }
  return { stock: deck, tableau, completed: [], moves: 0, score: 0, deals: 0, difficulty };
}

export function isSpiderGame(value: unknown): value is SpiderGame {
  const game = value as SpiderGame | null;
  return Boolean(
    game &&
      (game.difficulty === 1 || game.difficulty === 2 || game.difficulty === 4) &&
      Array.isArray(game.stock) &&
      Array.isArray(game.tableau) &&
      game.tableau.length === SPIDER_COLUMNS &&
      game.tableau.every((pile) => Array.isArray(pile)) &&
      Array.isArray(game.completed) &&
      typeof game.moves === "number" &&
      typeof game.score === "number" &&
      typeof game.deals === "number",
  );
}

export function validRun(cards: Card[], index: number) {
  if (index < 0 || index >= cards.length) return false;
  const first = cards[index];
  if (!first.faceUp) return false;
  for (let offset = index + 1; offset < cards.length; offset += 1) {
    if (!cards[offset].faceUp) return false;
    if (cards[offset].suit !== first.suit || cards[offset].value !== cards[offset - 1].value - 1) return false;
  }
  return true;
}

export function canMove(game: SpiderGame, fromColumn: number, index: number, toColumn: number) {
  if (fromColumn === toColumn) return false;
  const source = game.tableau[fromColumn];
  const target = game.tableau[toColumn];
  if (!source || !target || !validRun(source, index)) return false;
  const moving = source[index];
  const top = target.at(-1);
  if (!top) return true;
  return top.faceUp && top.value === moving.value + 1;
}

function collectCompleted(game: SpiderGame) {
  for (const pile of game.tableau) {
    while (pile.length >= 13) {
      const run = pile.slice(-13);
      const suit = run[0].suit;
      const complete = run.every(
        (card, offset) => card.faceUp && card.suit === suit && card.value === 13 - offset,
      );
      if (!complete) break;
      game.completed.push(pile.splice(-13, 13));
      game.score += 100;
      const exposed = pile.at(-1);
      if (exposed && !exposed.faceUp) {
        exposed.faceUp = true;
        game.score += 5;
      }
    }
  }
}

export function applyMove(
  game: SpiderGame,
  fromColumn: number,
  index: number,
  toColumn: number,
): SpiderGame | null {
  if (!canMove(game, fromColumn, index, toColumn)) return null;
  const next = structuredClone(game);
  const moving = next.tableau[fromColumn].splice(index);
  next.tableau[toColumn].push(...moving);
  next.moves += 1;
  next.score += 5;
  const exposed = next.tableau[fromColumn].at(-1);
  if (exposed && !exposed.faceUp) {
    exposed.faceUp = true;
    next.score += 5;
  }
  collectCompleted(next);
  return next;
}

export function dealStock(game: SpiderGame): { game: SpiderGame; error?: string } {
  if (!game.stock.length) return { game, error: "There are no cards left in the stock." };
  if (game.tableau.some((pile) => pile.length === 0))
    return { game, error: "Fill every empty column before dealing." };
  const next = structuredClone(game);
  for (let column = 0; column < SPIDER_COLUMNS; column += 1) {
    const card = next.stock.pop();
    if (!card) break;
    card.faceUp = true;
    next.tableau[column].push(card);
  }
  next.deals += 1;
  next.moves += 1;
  collectCompleted(next);
  return { game: next };
}

export function remainingDeals(game: SpiderGame) {
  return Math.ceil(game.stock.length / SPIDER_DEAL_SIZE);
}

export function findHint(game: SpiderGame): SpiderHint {
  let best: { from: SpiderPick; to: number; score: number } | null = null;
  for (let fromColumn = 0; fromColumn < SPIDER_COLUMNS; fromColumn += 1) {
    const source = game.tableau[fromColumn];
    for (let index = 0; index < source.length; index += 1) {
      if (!validRun(source, index)) continue;
      const moving = source[index];
      for (let toColumn = 0; toColumn < SPIDER_COLUMNS; toColumn += 1) {
        if (!canMove(game, fromColumn, index, toColumn)) continue;
        const target = game.tableau[toColumn];
        const top = target.at(-1);
        let value = 10;
        if (index > 0 && !source[index - 1].faceUp) value += 200;
        if (top && top.suit === moving.suit) value += 100;
        if (!target.length) value += 50;
        if (top && top.suit === moving.suit && top.value === moving.value + 1) value += 40;
        const next = applyMove(game, fromColumn, index, toColumn);
        if (next && next.completed.length > game.completed.length) value += 1000;
        if (!best || value > best.score) best = { from: { column: fromColumn, index }, to: toColumn, score: value };
      }
    }
  }
  if (best)
    return {
      kind: "move",
      from: best.from,
      to: best.to,
      text: "Try this move to build a longer same-suit run.",
    };
  if (game.stock.length && !game.tableau.some((pile) => pile.length === 0))
    return { kind: "deal", text: "Deal the next ten cards from the stock." };
  return null;
}
