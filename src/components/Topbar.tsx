import { Download, PlusCircle } from 'lucide-react';
import { ActiveTab } from '../types';

interface TopbarProps {
  activeTab: ActiveTab;
  onExport: () => void;
  onAddNew: () => void;
}

export default function Topbar({ activeTab, onExport, onAddNew }: TopbarProps) {
  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            Panel <span className="text-[#00e5ff]">Principal</span>
          </>
        );
      case 'clientes':
        return (
          <>
            Gestión de <span className="text-[#00e5ff]">Clientes</span>
          </>
        );
      case 'empleados':
        return (
          <>
            Gestión de <span className="text-[#00e5ff]">Empleados</span>
          </>
        );
      case 'equipos':
        return (
          <>
            Control de <span className="text-[#00e5ff]">Equipos</span>
          </>
        );
      case 'servicios':
        return (
          <>
            Catálogo de <span className="text-[#00e5ff]">Servicios</span>
          </>
        );
      case 'ventas':
        return (
          <>
            Registro de <span className="text-[#00e5ff]">Ventas</span>
          </>
        );
      case 'detalle':
        return (
          <>
            Detalle de <span className="text-[#00e5ff]">Ventas</span>
          </>
        );
      default:
        return 'Panel Principal';
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 md:px-8 border-b border-[rgba(0,229,255,0.12)] bg-[rgba(10,14,26,0.85)] backdrop-blur-md sticky top-0 z-40 select-none">
      <div className="text-white text-lg md:text-xl font-extrabold tracking-tight">
        {getTitle()}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-[#111827] text-[#e2e8f0] hover:text-[#00e5ff] hover:border-[#00e5ff] border border-[rgba(0,229,255,0.12)] rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer"
          title="Exportar datos a archivo CSV compatible con Excel"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exportar CSV</span>
        </button>

        <button
          onClick={onAddNew}
          className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-[#00e5ff] text-black hover:shadow-[0_0_24px_rgba(0,229,255,0.5)] active:scale-95 hover:brightness-110 font-bold rounded-lg text-xs tracking-tight transition-all duration-200 cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Nuevo{activeTab !== 'dashboard' && ` ${activeTab}`}</span>
        </button>
      </div>
    </header>
  );
}
