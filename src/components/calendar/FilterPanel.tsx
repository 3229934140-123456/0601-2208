import { RefreshCw, Package, Waves, Droplets, Cylinder, Boxes } from 'lucide-react';
import { usePortStore } from '@/store/usePortStore';
import { CARGO_LABELS, type CargoType } from '@/types';
import { cn } from '@/lib/utils';

const cargoIcons: Record<CargoType, React.ComponentType<{ className?: string }>> = {
  container: Package,
  bulk: Boxes,
  liquid: Droplets,
  gas: Cylinder,
  general: Waves,
};

const allCargoTypes: CargoType[] = ['container', 'bulk', 'liquid', 'gas', 'general'];

// 筛选面板：水深筛选 + 作业能力筛选 + 重置按钮
export default function FilterPanel() {
  const { filters, setFilters, resetFilters } = usePortStore();

  const toggleCapability = (type: CargoType) => {
    const current = filters.capabilities;
    if (current.includes(type)) {
      setFilters({ capabilities: current.filter((c) => c !== type) });
    } else {
      setFilters({ capabilities: [...current, type] });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-700/60 bg-slatex-800/60 p-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-300">水深(m)</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={20}
            step={0.5}
            value={filters.draftMin}
            onChange={(e) => setFilters({ draftMin: Number(e.target.value) })}
            className="h-9 w-20 rounded-md border border-slate-600 bg-slatex-850 px-3 text-sm text-slate-100 outline-none transition-all focus:border-port-500 focus:ring-1 focus:ring-port-500/40"
            placeholder="最小"
          />
          <span className="text-slate-500">~</span>
          <input
            type="number"
            min={0}
            max={30}
            step={0.5}
            value={filters.draftMax}
            onChange={(e) => setFilters({ draftMax: Number(e.target.value) })}
            className="h-9 w-20 rounded-md border border-slate-600 bg-slatex-850 px-3 text-sm text-slate-100 outline-none transition-all focus:border-port-500 focus:ring-1 focus:ring-port-500/40"
            placeholder="最大"
          />
        </div>
      </div>

      <div className="h-6 w-px bg-slate-700" />

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-300">作业能力</span>
        <div className="flex items-center gap-2">
          {allCargoTypes.map((type) => {
            const Icon = cargoIcons[type];
            const active = filters.capabilities.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleCapability(type)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all',
                  active
                    ? 'border-port-500 bg-port-500/20 text-port-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                    : 'border-slate-600 bg-slatex-850 text-slate-400 hover:border-slate-500 hover:text-slate-300',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {CARGO_LABELS[type]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="ml-auto">
        <button
          type="button"
          onClick={resetFilters}
          className="flex items-center gap-1.5 rounded-md border border-slate-600 bg-slatex-850 px-3 py-1.5 text-xs font-medium text-slate-400 transition-all hover:border-slate-500 hover:text-slate-200"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          重置
        </button>
      </div>
    </div>
  );
}
