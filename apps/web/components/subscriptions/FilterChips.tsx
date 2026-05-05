"use client";

interface FilterChipsProps {
  categories: string[];
  activeCategory: string | null;
  onSelectCategory: (c: string | null) => void;
  cycles: string[];
  activeCycle: string | null;
  onSelectCycle: (c: string | null) => void;
}

export function FilterChips({ 
  categories, activeCategory, onSelectCategory,
  cycles, activeCycle, onSelectCycle
}: FilterChipsProps) {
  return (
    <div className="space-y-3 mt-6">
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        <button
          onClick={() => onSelectCategory(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
            activeCategory === null 
              ? 'bg-amber text-black border-amber' 
              : 'bg-surface-2 text-muted border-[rgba(240,246,252,0.1)] hover:border-[rgba(240,246,252,0.3)]'
          }`}
        >
          All Categories
        </button>
        {categories.map(c => (
          <button
            key={c}
            onClick={() => onSelectCategory(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap capitalize transition-colors cursor-pointer border ${
              activeCategory === c 
                ? 'bg-amber text-black border-amber' 
                : 'bg-surface-2 text-muted border-[rgba(240,246,252,0.1)] hover:border-[rgba(240,246,252,0.3)]'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        <button
          onClick={() => onSelectCycle(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
            activeCycle === null 
              ? 'bg-teal text-black border-teal' 
              : 'bg-surface-2 text-muted border-[rgba(240,246,252,0.1)] hover:border-[rgba(240,246,252,0.3)]'
          }`}
        >
          All Cycles
        </button>
        {cycles.map(c => (
          <button
            key={c}
            onClick={() => onSelectCycle(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap capitalize transition-colors cursor-pointer border ${
              activeCycle === c 
                ? 'bg-teal text-black border-teal' 
                : 'bg-surface-2 text-muted border-[rgba(240,246,252,0.1)] hover:border-[rgba(240,246,252,0.3)]'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
