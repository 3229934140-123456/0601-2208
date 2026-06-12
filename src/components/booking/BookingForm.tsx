import { useEffect, useMemo, useState } from 'react';
import { X, AlertTriangle, Ship, Anchor, Ruler, Gauge, Save, FolderCheck, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortStore } from '@/store/usePortStore';
import { CARGO_LABELS, type Booking, type BookingFormData, type Berth, type CargoType } from '@/types';

interface BookingFormProps {
  open: boolean;
  onClose: () => void;
  initialData?: Partial<Booking>;
}

const cargoTypes: CargoType[] = ['container', 'bulk', 'liquid', 'gas', 'general'];
const nationalities = ['中国', '巴拿马', '利比里亚', '新加坡', '马绍尔群岛', '中国香港'];
const agents = [
  { id: 'a1', name: '中远船代' },
  { id: 'a2', name: '外轮船代' },
  { id: 'a3', name: '海油船代' },
  { id: 'a4', name: '中外运船代' },
];

const toLocalInput = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const defaultForm: BookingFormData = {
  shipName: '',
  imoNumber: '',
  nationality: '中国',
  dwt: '',
  draft: '',
  length: '',
  cargoType: '',
  cargoAmount: '',
  specialRequirements: '',
  eta: toLocalInput(new Date()),
  etb: toLocalInput(new Date(Date.now() + 4 * 3600 * 1000)),
  etd: toLocalInput(new Date(Date.now() + 16 * 3600 * 1000)),
  berthId: null,
  agentId: 'a1',
  agentName: '中远船代',
};

// 预约表单Modal
export default function BookingForm({ open, onClose, initialData }: BookingFormProps) {
  const [form, setForm] = useState<BookingFormData>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { createBooking, detectConflict, recommendBerths, getBerthUtilization, berths } = usePortStore();

  useEffect(() => {
    if (open) {
      setForm({ ...defaultForm });
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    if (initialData) {
      setForm((f) => ({
        ...f,
        shipName: initialData.shipName || '',
        imoNumber: initialData.imoNumber || '',
        nationality: initialData.nationality || '中国',
        dwt: initialData.dwt || '',
        draft: initialData.draft || '',
        length: initialData.length || '',
        cargoType: initialData.cargoType || '',
        cargoAmount: initialData.cargoAmount || '',
        berthId: initialData.berthId || null,
      }));
    }
  }, [initialData]);

  const update = (k: keyof BookingFormData, v: string | number | null) => {
    setForm((f) => {
      const nf = { ...f, [k]: v } as BookingFormData;
      if (k === 'agentId') {
        const ag = agents.find((a) => a.id === v);
        if (ag) {
          nf.agentName = ag.name;
        }
      }
      return nf;
    });
  };

  const recommended = useMemo<Berth[]>(() => {
    const draft = Number(form.draft) || 0;
    const dwt = Number(form.dwt) || 0;
    const length = Number(form.length) || 0;
    const ct = form.cargoType as CargoType;
    if (!draft || !dwt || !length || !ct) return [];
    return recommendBerths(draft, dwt, length, ct);
  }, [form.draft, form.dwt, form.length, form.cargoType, recommendBerths]);

  const conflict = useMemo(() => {
    if (!form.etb || !form.etd || !form.berthId) return null;
    return detectConflict(new Date(form.etb), new Date(form.etd), form.berthId);
  }, [form.etb, form.etd, form.berthId, detectConflict]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.shipName.trim()) e.shipName = '请输入船名';
    if (!form.dwt || Number(form.dwt) <= 0) e.dwt = '请输入有效的DWT';
    if (!form.draft || Number(form.draft) <= 0) e.draft = '请输入有效吃水';
    if (!form.length || Number(form.length) <= 0) e.length = '请输入有效船长';
    if (!form.cargoType) e.cargoType = '请选择货类';
    if (!form.cargoAmount || Number(form.cargoAmount) <= 0) e.cargoAmount = '请输入货量';
    if (!form.eta) e.eta = '请选择ETA';
    if (!form.etb) e.etb = '请选择ETB';
    if (!form.etd) e.etd = '请选择ETD';
    if (form.etb && form.etd && new Date(form.etb) >= new Date(form.etd)) {
      e.etd = 'ETD必须晚于ETB';
    }
    if (form.eta && form.etb && new Date(form.eta) > new Date(form.etb)) {
      e.etb = 'ETB必须晚于或等于ETA';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = (assignBerth: boolean) => {
    if (!validate()) return;
    if (assignBerth && conflict?.hasConflict) return;
    const result = createBooking(form, assignBerth);
    if (result) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-down">
      <div className="flex h-[90vh] w-[1100px] max-w-[95vw] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slatex-850 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-port-600/20 text-port-400">
              <Anchor className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">新增船舶预约</h2>
              <p className="text-xs text-slate-400">登记船舶信息并分配泊位</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slatex-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-700/60 bg-slatex-800/50 p-4">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-200">
                  <Ship className="h-4 w-4 text-port-400" />
                  船舶信息
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { k: 'shipName', label: '船名 *', type: 'text', placeholder: '如 远洋号' },
                    { k: 'imoNumber', label: 'IMO编号', type: 'text', placeholder: 'IMO9123456' },
                    { k: 'nationality', label: '国籍 *', type: 'select', options: nationalities },
                    { k: 'agentId', label: '船代 *', type: 'select', options: agents.map((a) => ({ value: a.id, label: a.name })) },
                    { k: 'dwt', label: '载重吨DWT *', type: 'number', placeholder: '50000', suffix: '吨', icon: Gauge },
                    { k: 'draft', label: '吃水 *', type: 'number', placeholder: '11.5', suffix: 'm', step: '0.1', icon: Ruler },
                    { k: 'length', label: '船长 *', type: 'number', placeholder: '210', suffix: 'm', icon: Ruler },
                  ].map((f) => (
                    <div key={f.k} className="col-span-2 sm:col-span-1">
                      <label className="mb-1 block text-xs text-slate-400">{f.label}</label>
                      <div className="relative">
                        {f.type === 'select' ? (
                          <select
                            value={String(form[f.k as keyof BookingFormData] || '')}
                            onChange={(e) => update(f.k as keyof BookingFormData, e.target.value)}
                            className={cn(
                              'h-9 w-full rounded-md border bg-slatex-850 px-3 text-sm text-slate-100 outline-none transition-all',
                              errors[f.k] ? 'border-red-500/60 focus:border-red-500' : 'border-slate-600 focus:border-port-500 focus:ring-1 focus:ring-port-500/40',
                            )}
                          >
                            {(f.options as { value?: string; label: string }[]).map((opt) => (
                              <option key={opt.label} value={opt.value ?? opt.label}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={f.type as string}
                            step={(f as { step?: string }).step}
                            placeholder={f.placeholder}
                            value={String(form[f.k as keyof BookingFormData] ?? '')}
                            onChange={(e) => update(f.k as keyof BookingFormData, f.type === 'number' ? e.target.value : e.target.value)}
                            className={cn(
                              'h-9 w-full rounded-md border bg-slatex-850 px-3 text-sm text-slate-100 outline-none transition-all',
                              f.suffix && 'pr-10',
                              errors[f.k] ? 'border-red-500/60 focus:border-red-500' : 'border-slate-600 focus:border-port-500 focus:ring-1 focus:ring-port-500/40',
                            )}
                          />
                        )}
                        {f.suffix && (
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                            {f.suffix}
                          </span>
                        )}
                      </div>
                      {errors[f.k] && <p className="mt-1 text-xs text-red-400">{errors[f.k]}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-700/60 bg-slatex-800/50 p-4">
                <h3 className="mb-4 text-sm font-bold text-slate-200">货物信息</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">货类 *</label>
                    <select
                      value={form.cargoType}
                      onChange={(e) => update('cargoType', e.target.value)}
                      className={cn(
                        'h-9 w-full rounded-md border bg-slatex-850 px-3 text-sm text-slate-100 outline-none transition-all',
                        errors.cargoType ? 'border-red-500/60' : 'border-slate-600 focus:border-port-500 focus:ring-1 focus:ring-port-500/40',
                      )}
                    >
                      <option value="">请选择货类</option>
                      {cargoTypes.map((c) => (
                        <option key={c} value={c}>
                          {CARGO_LABELS[c]}
                        </option>
                      ))}
                    </select>
                    {errors.cargoType && <p className="mt-1 text-xs text-red-400">{errors.cargoType}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">货量 *</label>
                    <input
                      type="number"
                      placeholder="如 2800"
                      value={String(form.cargoAmount ?? '')}
                      onChange={(e) => update('cargoAmount', e.target.value)}
                      className={cn(
                        'h-9 w-full rounded-md border bg-slatex-850 px-3 pr-8 text-sm text-slate-100 outline-none transition-all',
                        errors.cargoAmount ? 'border-red-500/60' : 'border-slate-600 focus:border-port-500 focus:ring-1 focus:ring-port-500/40',
                      )}
                    />
                    {errors.cargoAmount && <p className="mt-1 text-xs text-red-400">{errors.cargoAmount}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs text-slate-400">特殊作业需求</label>
                    <textarea
                      rows={2}
                      placeholder="如需危险品作业、夜间照明、特殊设备等..."
                      value={form.specialRequirements ?? ''}
                      onChange={(e) => update('specialRequirements', e.target.value)}
                      className="w-full resize-none rounded-md border border-slate-600 bg-slatex-850 px-3 py-2 text-sm text-slate-100 outline-none transition-all focus:border-port-500 focus:ring-1 focus:ring-port-500/40"
                    />
                  </div>
                </div>

                <h3 className="mb-3 mt-4 text-sm font-bold text-slate-200">时间信息</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { k: 'eta', label: 'ETA到港 *' },
                    { k: 'etb', label: 'ETB靠泊 *' },
                    { k: 'etd', label: 'ETD离港 *' },
                  ].map((t) => (
                    <div key={t.k}>
                      <label className="mb-1 block text-xs text-slate-400">{t.label}</label>
                      <input
                        type="datetime-local"
                        value={form[t.k as 'eta' | 'etb' | 'etd']}
                        onChange={(e) => update(t.k as keyof BookingFormData, e.target.value)}
                        className={cn(
                          'h-9 w-full rounded-md border bg-slatex-850 px-2 text-xs text-slate-100 outline-none transition-all',
                          errors[t.k] ? 'border-red-500/60' : 'border-slate-600 focus:border-port-500 focus:ring-1 focus:ring-port-500/40',
                        )}
                      />
                      {errors[t.k] && <p className="mt-1 text-xs text-red-400">{errors[t.k]}</p>}
                    </div>
                  ))}
                </div>
                {conflict?.hasConflict && (
                  <div className="mt-3 flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <div>
                      <div className="font-semibold">时间冲突</div>
                      <div>与 {conflict.conflictShipName} 的靠泊时间重叠，请调整时间或更换泊位</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-700/60 bg-slatex-800/50 p-4">
                <h3 className="mb-3 text-sm font-bold text-slate-200">泊位推荐</h3>
                {recommended.length === 0 ? (
                  <div className="rounded-md bg-slatex-850 p-4 text-center text-xs text-slate-400">
                    {form.cargoType && form.draft ? '暂无符合条件的泊位，请调整参数' : '请完整填写船舶参数以获取推荐'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recommended.map((b) => {
                      const util = getBerthUtilization(b.id);
                      const selected = form.berthId === b.id;
                      return (
                        <button
                          type="button"
                          key={b.id}
                          onClick={() => update('berthId', selected ? null : b.id)}
                          className={cn(
                            'w-full rounded-lg border p-3 text-left transition-all',
                            selected
                              ? 'border-port-500 bg-port-500/10'
                              : 'border-slate-600 bg-slatex-850 hover:border-slate-500',
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {selected && <CheckCircle2 className="h-4 w-4 text-port-400" />}
                              <span className="text-sm font-semibold text-slate-100">{b.name}</span>
                              <span className="rounded bg-slate-700/50 px-1.5 py-0.5 text-[10px] text-slate-300">
                                水深 {b.depth}m
                              </span>
                            </div>
                            <span className="text-xs text-slate-400">占用率 {util}%</span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700/60">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                util < 50 ? 'bg-emerald-500' : util < 80 ? 'bg-amber-500' : 'bg-red-500',
                              )}
                              style={{ width: `${util}%` }}
                            />
                          </div>
                        </button>
                      );
                    })}
                    {berths.filter((b) => !recommended.find((r) => r.id === b.id)).length > 0 && (
                      <div className="pt-2 text-xs text-slate-500">
                        其他 {berths.length - recommended.length} 个泊位因条件不符未列出
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-700 px-6 py-4 bg-slatex-850/80">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-600 bg-slatex-800 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slatex-700"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            className="flex items-center gap-1.5 rounded-md border border-slate-600 bg-slatex-800 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slatex-700"
          >
            <Save className="h-4 w-4" />
            仅保存
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={!form.berthId || !!conflict?.hasConflict}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all',
              form.berthId && !conflict?.hasConflict
                ? 'bg-port-600 text-white shadow-lg shadow-port-600/20 hover:bg-port-500'
                : 'cursor-not-allowed bg-slate-700 text-slate-400',
            )}
          >
            <FolderCheck className="h-4 w-4" />
            保存并分配泊位
          </button>
        </div>
      </div>
    </div>
  );
}
