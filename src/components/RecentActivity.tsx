import { DollarSign, UserCheck, Inbox } from 'lucide-react';
import { DBState } from '../types';
import { formatCurrency } from '../utils';

interface RecentActivityProps {
  db: DBState;
}

export default function RecentActivity({ db }: RecentActivityProps) {
  // Grab reversing slices of sales and customer profile additions
  const salesActivities = db.ventas.map(v => {
    const cli = db.clientes.find(c => c.id === v.id_cliente);
    const clientName = cli ? `${cli.nombres} ${cli.apellidos}` : `ID ${v.id_cliente}`;
    return {
      type: 'sale',
      title: `Venta generada #${v.id}`,
      subtitle: `Cliente: ${clientName}`,
      amount: formatCurrency(v.total),
      time: v.fecha_venta || 'Reciente',
      icon: DollarSign,
      color: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
    };
  });

  const clientActivities = db.clientes.map(c => ({
    type: 'client',
    title: `Cliente registrado`,
    subtitle: `${c.nombres} ${c.apellidos} - CI: ${c.cedula}`,
    amount: 'Nuevo Perfil',
    time: 'Hoy',
    icon: UserCheck,
    color: 'text-[#00e5ff] bg-[#00e5ff]/10 border border-[#00e5ff]/20'
  }));

  // Match list and display top 5
  const combinedActivities = [...salesActivities, ...clientActivities]
    .sort((a, b) => {
      // Simplistic fallback sort: sales first, then clients
      if (a.type !== b.type) {
        return a.type === 'sale' ? -1 : 1;
      }
      return b.title.localeCompare(a.title);
    })
    .slice(0, 5);

  if (combinedActivities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-[#64748b]">
        <Inbox className="w-10 h-10 opacity-30 mb-2" />
        <p className="text-xs">No hay operaciones registradas aún</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[rgba(255,255,255,0.04)] font-display">
      {combinedActivities.map((act, index) => {
        const Icon = act.icon;
        return (
          <div key={index} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 ${act.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white text-xs font-bold truncate">
                {act.title}
              </div>
              <div className="text-[#64748b] text-[11px] font-mono truncate mt-0.5">
                {act.subtitle}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-white text-xs font-mono font-bold">
                {act.amount}
              </div>
              <div className="text-[#64748b] text-[10px] font-mono mt-0.5">
                {act.time}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
