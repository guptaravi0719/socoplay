import { ClassicGamePage } from "../../components/classic-game-page";
import { gameMetadata } from "../../lib/seo";

export const metadata = gameMetadata("sudoku");
export default function SudokuPage() { return <ClassicGamePage game={{ slug: "sudoku", name: "Sudoku", eyebrow: "NUMBER PUZZLE", description: "Pick a difficulty, fill the grid, and solve at your own pace." }} />; }
