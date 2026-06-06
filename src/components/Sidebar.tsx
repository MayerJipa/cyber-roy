import { LayoutDashboard, Users, UserCheck, Monitor, Cpu, DollarSign, ListCollapse } from 'lucide-react';
import { ActiveTab, DBState } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  db: DBState;
}

export default function Sidebar({ activeTab, onTabChange, db }: SidebarProps) {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clientes' as ActiveTab, label: 'Clientes', icon: Users, badge: db.clientes.length },
    { id: 'empleados' as ActiveTab, label: 'Empleados', icon: UserCheck, badge: db.empleados.length },
    { id: 'equipos' as ActiveTab, label: 'Equipos', icon: Monitor, badge: db.equipos.length },
    { id: 'servicios' as ActiveTab, label: 'Servicios', icon: Cpu, badge: db.servicios.length },
    { id: 'ventas' as ActiveTab, label: 'Ventas', icon: DollarSign, badge: db.ventas.length },
    { id: 'detalle' as ActiveTab, label: 'Detalle Ventas', icon: ListCollapse },
  ];

  return (
    <nav className="fixed left-0 top-0 bottom-0 w-16 md:w-60 bg-gradient-to-b from-[#0d1424] to-[#0a0e1a] border-r border-[rgba(0,229,255,0.12)] flex flex-col z-50 select-none transition-all duration-300">
      {/* Logo Header */}
      <div className="p-4 md:p-6 border-b border-[rgba(0,229,255,0.12)] flex flex-col items-center md:items-start select-none">
        <div className="w-10 h-10 bg-[#00e5ff] rounded-xl flex items-center justify-center text-xl text-black font-extrabold shadow-[0_0_24px_rgba(0,229,255,0.4)] mb-3">
          💻
        </div>
        <h1 className="hidden md:block text-white text-lg font-extrabold tracking-tight">
          Cyber Roy
        </h1>
        <span className="hidden md:block text-[#00e5ff] text-[10px] font-mono tracking-[2px] uppercase">
          Sistema de Gestión
        </span>
      </div>

      {/* Navigation list */}
      <div className="flex-1 px-2 md:px-3 py-5 flex flex-col gap-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-center md:justify-start gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer border ${
                isActive
                  ? 'bg-[rgba(0,229,255,0.08)] text-[#00e5ff] border-[rgba(0,229,255,0.2)] shadow-[0_0_15px_rgba(0,229,255,0.05)]'
                  : 'text-[#64748b] border-transparent hover:bg-[#111827] hover:text-[#e2e8f0]'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden md:inline">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="hidden md:inline-block ml-auto bg-[#7c3aed] text-white text-[10px] font-mono px-2 py-0.5 rounded-full select-none">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Profile */}
      <div className="p-3 md:p-4 border-t border-[rgba(0,229,255,0.12)]">
        <div className="flex items-center gap-3 p-2 bg-[#111827] rounded-xl border border-[rgba(0,229,255,0.12)]">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 select-none border border-[rgba(0,229,255,0.2)] bg-gradient-to-br from-[#7c3aed] to-[#00e5ff] flex items-center justify-center">
            <img 
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop" 
              alt="Mayer Roy Avatar" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="hidden md:block min-w-0">
            <div className="text-white text-xs font-bold truncate">Mayer Roy</div>
            <div className="text-[#64748b] text-[10px] font-mono truncate">Administrador</div>
          </div>
        </div>
      </div>
    </nav>
  );
}
