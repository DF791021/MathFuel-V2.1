import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Streamdown } from 'streamdown';

/**
 * All content in this page are only for example, replace with your own feature implementation
 * When building pages, remember your instructions in Frontend Best Practices, Design Guide and Common Pitfalls
 */
import GameBoard from "@/components/GameBoard";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f0e6d2] p-4 md:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-6xl text-[#8b5a2b] drop-shadow-sm mb-2">
          Wisconsin Food Explorer
        </h1>
        <p className="text-lg text-[#5c4033] font-bold opacity-80">
          A Nutrition Adventure for Elementary Students
        </p>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <GameBoard />
      </main>

      <footer className="mt-8 text-center text-sm text-[#5c4033]/60 font-bold">
        © 2025 Wisconsin Department of Public Instruction • Nutrition Education
      </footer>
    </div>
  );
}
