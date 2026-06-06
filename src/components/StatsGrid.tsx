import { Users, CreditCard, Layers, ArrowUpRight } from 'lucide-react';
import { DBState } from '../types';
import { formatCurrency } from '../utils';

interface StatsGridProps {
  db: DBState;
}

export default function StatsGrid({ db }: StatsGridProps) {
  const totalRevenues = db.ventas.reduce((acc, v) => acc + Number(v.total), 0);

  const stats = [
    {
      label: 'Clientes',
      value: db.clientes.length,
      subText: 'Registrados activos',
      icon: Users,
      color: '#00e5ff',
      glow: 'rgba(0,229,255,0.15)',
    },
    {
      label: 'Ventas Totales',
      value: db.ventas.length,
      subText: 'Transacciones registradas',
      icon: CreditCard,
      color: '#10b981',
      glow: 'rgba(16,185,129,0.15)',
    },
    {
      label: 'Servicios',
      value: db.servicios.length,
      subText: 'Disponibles en catálogo',
      icon: Layers,
      color: '#7c3aed',
      glow: 'rgba(124,58,237,0.15)',
    },
    {
      label: 'Ingresos',
      value: formatCurrency(totalRevenues),
      subText: 'Acumulado total',
      icon: ArrowUpRight,
      color: '#f59e0b',
      glow: 'rgba(245,158,11,0.15)',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 select-none">
      {stats.map((st, i) => {
        const Icon = st.icon;
        return (
          <div
            key={i}
            style={{
              boxShadow: `0 4px 20px -2px ${st.glow}`,
              borderTop: `2px solid ${st.color}`,
            }}
            className="bg-[#111827] border border-[rgba(0,229,255,0.12)] rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(0,229,255,0.2)]"
          >
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#64748b] mb-2.5">
              {st.label}
            </div>
            <div className="text-white text-3xl font-extrabold line-clamp-1 mb-1 tracking-tight">
              {st.value}
            </div>
            <div className="text-[#64748b] text-xs font-medium">
              {st.subText}
            </div>
            <span
              style={{ color: st.color }}
              className="absolute right-5 top-5 opacity-15 text-3xl shrink-0"
            >
              <Icon className="w-8 h-8" />
            </span>
          </div>
        );
      })}
    </div>
  );
}
