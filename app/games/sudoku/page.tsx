import type { Metadata } from "next";
import { ClassicGamePage } from "../../components/classic-game-page";

export const metadata: Metadata = { title: "Play Sudoku Online", description: "Solve touch-friendly Sudoku puzzles online on SocoPlay." };
export default function SudokuPage() { return <ClassicGamePage game={{ slug: "sudoku", name: "Sudoku", eyebrow: "NUMBER PUZZLE", description: "Pick a difficulty, fill the grid, and solve at your own pace." }} />; }
