import { useState, useEffect } from 'react';
import { Search, PlusCircle, PenSquare, Trash2, HelpCircle, MessageCircle } from 'lucide-react';
import { DBState, ActiveTab, Cliente, Empleado, Equipo, Servicio, Venta, DetalleVenta } from './types';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import StatsGrid from './components/StatsGrid';
import RecentActivity from './components/RecentActivity';
import ManagementModal from './components/ManagementModal';
import { formatCurrency, handleExportTab } from './utils';

// Default mock database structure to auto seed.
const DEFAULT_DB_DATA: DBState = {
  clientes: [
    { id: 1, nombres: 'Luis', apellidos: 'Pérez', cedula: '0801234567', telefono: '0991234567', correo: 'luis@mail.com', direccion: 'Av. Libertad 123' },
    { id: 2, nombres: 'Ana', apellidos: 'Torres', cedula: '0809876543', telefono: '0987654321', correo: 'ana@mail.com', direccion: 'Calle 5 de Junio 45' },
  ],
  empleados: [
    { id: 1, nombres: 'Mayer', apellidos: 'Jipa', cargo: 'Administrador', telefono: '0998765432', correo: 'mayer@cyberroy.com' },
    { id: 2, nombres: 'María', apellidos: 'Suárez', cargo: 'Cajera', telefono: '0994321678', correo: 'maria@cyberroy.com' },
  ],
  equipos: [
    { id: 1, nombre_equipo: 'PC-01', tipo_equipo: 'Desktop', estado: 'Activo', fecha_mantenimiento: '2026-07-15' },
    { id: 2, nombre_equipo: 'PC-02', tipo_equipo: 'Desktop', estado: 'En mantenimiento', fecha_mantenimiento: '2026-06-10' },
    { id: 3, nombre_equipo: 'Impresora HP', tipo_equipo: 'Periférico', estado: 'Activo', fecha_mantenimiento: '2026-08-01' },
  ],
  servicios: [
    { id: 1, nombre_servicio: 'Internet por hora', descripcion: 'Acceso a internet 1 hora', precio: 0.75 },
    { id: 2, nombre_servicio: 'Impresión B/N', descripcion: 'Impresión blanco y negro por hoja', precio: 0.10 },
    { id: 3, nombre_servicio: 'Impresión Color', descripcion: 'Impresión a color por hoja', precio: 0.30 },
    { id: 4, nombre_servicio: 'Escaneado', descripcion: 'Escaneo de documentos', precio: 0.25 },
  ],
  ventas: [
    { id: 1, fecha_venta: '2026-06-05', id_cliente: 1, id_empleado: 2, total: 1.85 },
    { id: 2, fecha_venta: '2026-06-05', id_cliente: 2, id_empleado: 2, total: 0.75 },
  ],
  detalle: [
    { id: 1, id_venta: 1, id_servicio: 1, cantidad: 2, subtotal: 1.50 },
    { id: 2, id_venta: 1, id_servicio: 4, cantidad: 1, subtotal: 0.25 },
    { id: 3, id_venta: 2, id_servicio: 1, cantidad: 1, subtotal: 0.75 },
  ],
  counters: { clientes: 2, empleados: 2, equipos: 3, servicios: 4, ventas: 2, detalle: 3 }
};

// Dynamic service image URL selector for visual catalogue preview
const getServiceImageUrl = (nombre: string): string => {
  const norm = nombre.toLowerCase();
  if (norm.includes('internet') || norm.includes('pc') || norm.includes('computadora') || norm.includes('hora')) {
    return 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=300&auto=format&fit=crop'; // Cyber cafe/gaming RGB gaming setups
  }
  if (norm.includes('impres') || norm.includes('hoja') || norm.includes('copia') || norm.includes('b/n') || norm.includes('color')) {
    return 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?q=80&w=300&auto=format&fit=crop'; // Laser printers emitting printouts
  }
  if (norm.includes('escan') || norm.includes('digitali')) {
    return 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=300&auto=format&fit=crop'; // Scanned document desks
  }
  return 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=300&auto=format&fit=crop'; // Technical digital network background
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State notifications toast
  const [toastMsg, setToastMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Read initial DB from local storage or fallback to seed data
  const [db, setDb] = useState<DBState>(() => {
    try {
      const persisted = localStorage.getItem('cyber_roy_data');
      if (persisted) {
        return JSON.parse(persisted);
      }
    } catch (e) {
      console.error("Failed to parse persisted data.", e);
    }
    return DEFAULT_DB_DATA;
  });

  // Watch DB changes and persist on the client side
  useEffect(() => {
    localStorage.setItem('cyber_roy_data', JSON.stringify(db));
  }, [db]);

  // Clean filters when changing tab
  useEffect(() => {
    setSearchQuery('');
  }, [activeTab]);

  // Display a temporary feedback toast
  const showToast = (text: string, isError: boolean = false) => {
    setToastMsg({ text, isError });
    setTimeout(() => {
      setToastMsg(null);
    }, 4500);
  };

  // ━━ MODAL FORMS STATE MANAGEMENT ━━
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'cliente' | 'empleado' | 'equipo' | 'servicio' | 'venta' | 'detalle'>('cliente');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Opens a contextual form
  const handleOpenForm = (type: 'cliente' | 'empleado' | 'equipo' | 'servicio' | 'venta' | 'detalle', id: number | null = null) => {
    setModalType(type);
    setEditingId(id);
    setIsModalOpen(true);
  };

  // Triggers creation in dashboard or active tab context
  const handleAddNewGlobal = () => {
    if (activeTab === 'dashboard') {
      handleOpenForm('venta'); // Default to generating a sale!
    } else {
      const singularMap: Record<string, any> = {
        clientes: 'cliente',
        empleados: 'empleado',
        equipos: 'equipo',
        servicios: 'servicio',
        ventas: 'venta',
        detalle: 'detalle'
      };
      const type = singularMap[activeTab];
      if (type) {
        handleOpenForm(type);
      }
    }
  };

  // Deletion mechanics
  const handleDeleteRecord = (table: 'clientes' | 'empleados' | 'equipos' | 'servicios' | 'ventas' | 'detalle', id: number) => {
    const confirmation = window.confirm('¿Está seguro de que desea eliminar este registro de la base de datos?');
    if (!confirmation) return;

    setDb(prev => {
      const filtered = (prev[table] as any[]).filter((record: any) => record.id !== id);
      return {
        ...prev,
        [table]: filtered
      };
    });
    showToast('Registro eliminado con éxito.');
  };

  // Save record (Create or Update)
  const handleSaveForm = (rawData: any) => {
    const tableMap: Record<string, 'clientes' | 'empleados' | 'equipos' | 'servicios' | 'ventas' | 'detalle'> = {
      cliente: 'clientes',
      empleado: 'empleados',
      equipo: 'equipos',
      servicio: 'servicios',
      venta: 'ventas',
      detalle: 'detalle'
    };

    const targetTable = tableMap[modalType];
    if (!targetTable) return;

    setDb(prev => {
      const list = [...prev[targetTable]] as any[];
      const counters = { ...prev.counters };

      if (editingId !== null) {
        // Edit flow
        const idx = list.findIndex(r => r.id === editingId);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...rawData, id: editingId };
        }
      } else {
        // Create flow
        const newId = (counters[targetTable] || 0) + 1;
        counters[targetTable] = newId;
        list.push({ ...rawData, id: newId });
      }

      return {
        ...prev,
        [targetTable]: list,
        counters
      };
    });

    setIsModalOpen(false);
    showToast(editingId !== null ? 'Registro actualizado correctamente' : 'Nuevo registro creado con éxito');
    setEditingId(null);
  };

  // Triggers CSV exports safely
  const triggerCSVExport = () => {
    handleExportTab(activeTab, db);
    showToast(`Datos de ${activeTab} exportados a CSV.`);
  };

  // ━━ FILTER SEARCH QUERY LOGIC ━━
  const getFilteredData = () => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      return {
        clientes: db.clientes,
        empleados: db.empleados,
        equipos: db.equipos,
        servicios: db.servicios,
        ventas: db.ventas,
        detalle: db.detalle
      };
    }

    return {
      clientes: db.clientes.filter(c =>
        c.nombres.toLowerCase().includes(q) ||
        c.apellidos.toLowerCase().includes(q) ||
        c.cedula.includes(q) ||
        c.telefono.includes(q) ||
        c.correo.toLowerCase().includes(q) ||
        c.direccion.toLowerCase().includes(q)
      ),
      empleados: db.empleados.filter(e =>
        e.nombres.toLowerCase().includes(q) ||
        e.apellidos.toLowerCase().includes(q) ||
        e.cargo.toLowerCase().includes(q) ||
        e.telefono.includes(q) ||
        e.correo.toLowerCase().includes(q)
      ),
      equipos: db.equipos.filter(eq =>
        eq.nombre_equipo.toLowerCase().includes(q) ||
        eq.tipo_equipo.toLowerCase().includes(q) ||
        eq.estado.toLowerCase().includes(q)
      ),
      servicios: db.servicios.filter(s =>
        s.nombre_servicio.toLowerCase().includes(q) ||
        s.descripcion.toLowerCase().includes(q) ||
        String(s.precio).includes(q)
      ),
      ventas: db.ventas.filter(v => {
        const cliObj = db.clientes.find(c => c.id === v.id_cliente);
        const empObj = db.empleados.find(e => e.id === v.id_empleado);
        const cliName = cliObj ? `${cliObj.nombres} ${cliObj.apellidos}`.toLowerCase() : '';
        const empName = empObj ? `${empObj.nombres} ${empObj.apellidos}`.toLowerCase() : '';
        return (
          String(v.id).includes(q) ||
          v.fecha_venta.includes(q) ||
          cliName.includes(q) ||
          empName.includes(q) ||
          String(v.total).includes(q)
        );
      }),
      detalle: db.detalle.filter(det => {
        const srvObj = db.servicios.find(s => s.id === det.id_servicio);
        const srvName = srvObj ? srvObj.nombre_servicio.toLowerCase() : '';
        return (
          String(det.id_venta).includes(q) ||
          srvName.includes(q) ||
          String(det.cantidad).includes(q) ||
          String(det.subtotal).includes(q)
        );
      })
    };
  };

  const filtered = getFilteredData();

  // Compute stats dictionary for Chart Distribution representation ("Ventas por servicio")
  const getChartData = () => {
    const counts: Record<string, { count: number; color: string }> = {};
    const chartColors = ['#00e5ff', '#10b981', '#7c3aed', '#f59e0b', '#ef4444'];
    
    db.detalle.forEach((d, idx) => {
      const s = db.servicios.find(sv => sv.id === d.id_servicio);
      const name = s ? s.nombre_servicio : 'Otro';
      if (!counts[name]) {
        counts[name] = { count: 0, color: chartColors[Object.keys(counts).length % chartColors.length] };
      }
      counts[name].count += d.cantidad;
    });

    const entries = Object.entries(counts);
    const maxVal = Math.max(...entries.map(e => e[1].count), 1);

    return { entries, maxVal };
  };

  const { entries: chartEntries, maxVal: chartMax } = getChartData();

  return (
    <div className="min-h-screen text-[#e2e8f0] relative">
      
      {/* Dynamic Feedback Toasts/Alert banner */}
      {toastMsg && (
        <div className="fixed bottom-24 right-6 z-[200] max-w-sm bg-[#1a2236] border border-[#00e5ff] shadow-[0_0_20px_rgba(0,229,255,0.3)] p-4 rounded-xl flex items-center gap-3 animate-bounce">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00e5ff] animate-ping" />
          <span className="text-white text-xs font-bold">{toastMsg.text}</span>
        </div>
      )}

      {/* Sidebar sidebar system */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} db={db} />

      {/* MAIN CONTAINER */}
      <div className="pl-16 md:pl-60 min-h-screen flex flex-col relative z-10">
        
        {/* Dynamic header Topbar */}
        <Topbar
          activeTab={activeTab}
          onExport={triggerCSVExport}
          onAddNew={handleAddNewGlobal}
        />

        {/* PAGE CONTENT PANEL */}
        <main className="flex-1 p-5 md:p-8 overflow-x-hidden">
          
          {/* ══ VIEW: DASHBOARD ══ */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Sleek Custom Gaming Banner Card */}
              <div id="dashboard-hero-banner" className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-[#111827] to-slate-900 border border-[rgba(0,229,255,0.15)] shadow-[0_0_30px_rgba(0,229,255,0.05)]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#00e5ff]/10 via-transparent to-transparent opacity-70 pointer-events-none" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8 relative z-10">
                  <div className="space-y-3 max-w-xl text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a2236] border border-[#00e5ff]/20 rounded-full text-[10px] font-mono text-[#00e5ff] tracking-wider uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-ping" />
                      Cyber Roy Operational Command V2.2
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                      Administración Inteligente para tu <span className="text-[#00e5ff] font-sans drop-shadow-[0_0_10px_rgba(0,229,255,0.3)]">Cyber Cafe</span>
                    </h2>
                    <p className="text-[#94a3b8] text-xs md:text-sm leading-relaxed">
                      Controla solicitudes, facturación de servicios, equipos gaming, personal de soporte y tarifas de internet en una interfaz diseñada para respuestas de alta velocidad.
                    </p>
                  </div>
                  
                  {/* Banner Image from Unsplash representing extreme gaming and tech setups */}
                  <div className="w-full md:w-80 h-44 rounded-xl overflow-hidden border border-[rgba(0,229,255,0.15)] shadow-[0_0_20px_rgba(0,229,255,0.1)] relative flex-shrink-0">
                    <img 
                      src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=640&auto=format&fit=crop" 
                      alt="Cyber Cafe Gaming Station" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md border border-white/10 px-2 py-1 rounded-md text-[9px] font-mono text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff]" />
                      <span>Equipos de Alto Rendimiento</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculations tiles metrics */}
              <StatsGrid db={db} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Visual Chart distribution bar */}
                <div className="bg-[#111827] border border-[rgba(0,229,255,0.12)] rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-white text-sm font-bold tracking-normal">Ventas por servicio</h4>
                    <p className="text-[#64748b] text-[11px] font-mono mt-0.5">Distribución volumétrica en unidades</p>
                  </div>

                  <div className="my-8">
                    {chartEntries.length > 0 ? (
                      <div className="flex items-end gap-3 h-32 px-2">
                        {chartEntries.map(([name, payload], index) => {
                          const percentHeight = (payload.count / chartMax) * 100;
                          return (
                            <div
                              key={index}
                              className="flex-1 flex flex-col items-center group relative h-full justify-end"
                            >
                              {/* Hover Tooltip tooltip */}
                              <div className="absolute -top-8 bg-[#1a2236] text-[10px] text-white font-mono rounded px-1.5 py-0.5 border border-[#00e5ff]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none select-none">
                                {payload.count} un.
                              </div>
                              <div
                                style={{
                                  height: `${percentHeight}%`,
                                  background: `linear-gradient(0deg, ${payload.color}, ${payload.color}33)`
                                }}
                                className="w-full rounded-t-md hover:brightness-125 transition-all duration-300 shadow-[0_0_12px_rgba(0,229,255,0.05)] cursor-help"
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-32 flex items-center justify-center text-[#64748b] text-xs font-mono">
                        Sin datos de ventas para graficar
                      </div>
                    )}
                  </div>

                  {/* Legends labels container */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-3 border-t border-[rgba(0,229,255,0.06)]">
                    {chartEntries.map(([name, payload], index) => (
                      <div key={index} className="flex items-center gap-1.5 text-[11px] font-mono">
                        <span style={{ color: payload.color }} className="text-sm">▪</span>
                        <span className="text-[#e2e8f0]">{name}</span>
                        <span className="text-[#64748b]">({payload.count})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activities feed log */}
                <div className="bg-[#111827] border border-[rgba(0,229,255,0.12)] rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-white text-sm font-bold">Actividad reciente</h4>
                    <p className="text-[#64748b] text-[11px] font-mono mt-0.5">Últimas transacciones registradas</p>
                  </div>
                  <div className="flex-1 mt-5">
                    <RecentActivity db={db} />
                  </div>
                </div>

              </div>

              {/* State of equipment list */}
              <div className="bg-[#111827] border border-[rgba(0,229,255,0.12)] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-[rgba(0,229,255,0.12)]">
                  <h4 className="text-white text-sm font-bold">Resumen de Equipos</h4>
                  <p className="text-[#64748b] text-[11px] font-mono mt-0.5">Control de servidores y terminales PC</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-[rgba(0,229,255,0.12)] bg-white/[0.01]">
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">ID</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Código</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Tipo</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Estado</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Mantenimiento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(255,255,255,0.03)] text-xs font-display">
                      {db.equipos.length > 0 ? (
                        db.equipos.map((eq) => (
                          <tr key={eq.id} className="hover:bg-[rgba(0,229,255,0.02)] transition">
                            <td className="px-5 py-3.5 font-mono text-[#64748b] font-semibold">#{eq.id}</td>
                            <td className="px-5 py-3.5 text-white font-bold">{eq.nombre_equipo}</td>
                            <td className="px-5 py-3.5"><span className="bg-[#1a2236] border border-[#00e5ff]/20 text-[#00e5ff] text-[10px] font-mono px-2 py-0.5 rounded-full">{eq.tipo_equipo}</span></td>
                            <td className="px-5 py-3.5">
                              {eq.estado === 'Activo' && (
                                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  {eq.estado}
                                </span>
                              )}
                              {eq.estado === 'En mantenimiento' && (
                                <span className="inline-flex items-center gap-1.5 bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] text-[10px] font-mono px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                                  {eq.estado}
                                </span>
                              )}
                              {eq.estado !== 'Activo' && eq.estado !== 'En mantenimiento' && (
                                <span className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                  {eq.estado}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-[#64748b]">{eq.fecha_mantenimiento}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-5 py-12 text-center text-[#64748b] font-mono">
                            No hay hardware registrado en la base de datos
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}


          {/* ══ VIEW: CLIENTES ══ */}
          {activeTab === 'clientes' && (
            <div className="space-y-5">
              
              {/* Search Toolbar */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="w-full sm:flex-1 relative">
                  <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="🔍 Buscar clientes por nombre, apellido, cédula, teléfono o correo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#111827] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#e2e8f0] outline-none transition"
                  />
                </div>
                <button
                  onClick={() => handleOpenForm('cliente')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00e5ff] text-black hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition rounded-lg text-xs font-extrabold cursor-pointer h-[40px]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Nuevo Cliente</span>
                </button>
              </div>

              {/* Data list view */}
              <div className="bg-[#111827] border border-[rgba(0,229,255,0.12)] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-[rgba(0,229,255,0.12)] flex items-center justify-between">
                  <div>
                    <h4 className="text-white text-sm font-bold">Clientes Registrados</h4>
                    <p className="text-[#64748b] text-[11px] font-mono mt-0.5">Gestión de datos de facturación</p>
                  </div>
                  <span className="bg-[#1a2236] border border-[rgba(0,229,255,0.12)] text-[#64748b] text-[11px] font-mono px-3 py-1 rounded-lg">
                    {filtered.clientes.length} registro(s)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-[rgba(0,229,255,0.12)] bg-white/[0.01]">
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">ID</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Nombre Completo</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Cédula CI</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Celular</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Correo electrónico</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Dirección de domicilio</th>
                        <th className="px-5 py-3 text-center text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(255,255,255,0.03)] text-xs font-display">
                      {filtered.clientes.length > 0 ? (
                        filtered.clientes.map((c) => (
                          <tr key={c.id} className="hover:bg-[rgba(0,229,255,0.02)] transition">
                            <td className="px-5 py-3.5 font-mono text-[#64748b] font-semibold">#{c.id}</td>
                            <td className="px-5 py-3.5 text-white font-bold">{c.nombres} {c.apellidos}</td>
                            <td className="px-5 py-3.5 font-mono text-gray-300">{c.cedula}</td>
                            <td className="px-5 py-3.5 font-mono text-[#64748b]">{c.telefono || 'N/A'}</td>
                            <td className="px-5 py-3.5 text-gray-300">{c.correo || 'N/A'}</td>
                            <td className="px-5 py-3.5 text-[#64748b] truncate max-w-xs" title={c.direccion}>{c.direccion || 'N/A'}</td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenForm('cliente', c.id)}
                                  className="p-1.5 bg-[#1f2937] hover:bg-gray-700 text-gray-200 hover:text-[#00e5ff] rounded-lg transition cursor-pointer"
                                  title="Editar"
                                >
                                  <PenSquare className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRecord('clientes', c.id)}
                                  className="p-1.5 bg-[#ef4444]/15 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-5 py-12 text-center text-[#64748b] font-mono">
                            No se encontraron clientes que coincidan con la búsqueda
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}


          {/* ══ VIEW: EMPLEADOS ══ */}
          {activeTab === 'empleados' && (
            <div className="space-y-5">
              
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="w-full sm:flex-1 relative">
                  <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="🔍 Buscar empleados por nombres, apellidos, cargo, correo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#111827] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#e2e8f0] outline-none transition"
                  />
                </div>
                <button
                  onClick={() => handleOpenForm('empleado')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00e5ff] text-black hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition rounded-lg text-xs font-extrabold cursor-pointer h-[40px]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Nuevo Empleado</span>
                </button>
              </div>

              <div className="bg-[#111827] border border-[rgba(0,229,255,0.12)] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-[rgba(0,229,255,0.12)] flex items-center justify-between">
                  <div>
                    <h4 className="text-white text-sm font-bold">Personal del Cibercafé</h4>
                    <p className="text-[#64748b] text-[11px] font-mono mt-0.5">Control de credenciales, cargos y comisiones</p>
                  </div>
                  <span className="bg-[#1a2236] border border-[rgba(0,229,255,0.12)] text-[#64748b] text-[11px] font-mono px-3 py-1 rounded-lg">
                    {filtered.empleados.length} registro(s)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-[rgba(0,229,255,0.12)] bg-white/[0.01]">
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">ID</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Colaborador</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Cargo / Puesto</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Teléfono Móvil</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Dirección de Correo</th>
                        <th className="px-5 py-3 text-center text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(255,255,255,0.03)] text-xs font-display">
                      {filtered.empleados.length > 0 ? (
                        filtered.empleados.map((emp) => (
                          <tr key={emp.id} className="hover:bg-[rgba(0,229,255,0.02)] transition">
                            <td className="px-5 py-3.5 font-mono text-[#64748b] font-semibold">#{emp.id}</td>
                            <td className="px-5 py-3.5 text-white font-bold">{emp.nombres} {emp.apellidos}</td>
                            <td className="px-5 py-3.5">
                              {emp.cargo === 'Administrador' && (
                                <span className="bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold">
                                  {emp.cargo}
                                </span>
                              )}
                              {emp.cargo === 'Cajera' && (
                                <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold">
                                  {emp.cargo}
                                </span>
                              )}
                              {emp.cargo !== 'Administrador' && emp.cargo !== 'Cajera' && (
                                <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold">
                                  {emp.cargo}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-[#64748b]">{emp.telefono || 'N/A'}</td>
                            <td className="px-5 py-3.5 text-gray-300">{emp.correo || 'N/A'}</td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenForm('empleado', emp.id)}
                                  className="p-1.5 bg-[#1f2937] hover:bg-gray-700 text-gray-200 hover:text-[#00e5ff] rounded-lg transition cursor-pointer"
                                  title="Editar"
                                >
                                  <PenSquare className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRecord('empleados', emp.id)}
                                  className="p-1.5 bg-[#ef4444]/15 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-5 py-12 text-center text-[#64748b] font-mono">
                            No se encontraron empleados que coincidan con la búsqueda
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}


          {/* ══ VIEW: EQUIPOS ══ */}
          {activeTab === 'equipos' && (
            <div className="space-y-5">
              
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="w-full sm:flex-1 relative">
                  <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="🔍 Buscar equipos por código, tipo o estado operativo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#111827] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#e2e8f0] outline-none transition"
                  />
                </div>
                <button
                  onClick={() => handleOpenForm('equipo')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00e5ff] text-black hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition rounded-lg text-xs font-extrabold cursor-pointer h-[40px]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Nuevo Equipo</span>
                </button>
              </div>

              <div className="bg-[#111827] border border-[rgba(0,229,255,0.12)] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-[rgba(0,229,255,0.12)] flex items-center justify-between">
                  <div>
                    <h4 className="text-white text-sm font-bold">Inventario de Equipos</h4>
                    <p className="text-[#64748b] text-[11px] font-mono mt-0.5">Control de terminales, mantenimiento y periféricos</p>
                  </div>
                  <span className="bg-[#1a2236] border border-[rgba(0,229,255,0.12)] text-[#64748b] text-[11px] font-mono px-3 py-1 rounded-lg">
                    {filtered.equipos.length} registro(s)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-[rgba(0,229,255,0.12)] bg-white/[0.01]">
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">ID</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Identificador</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Tipo de Dispositivo</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Estado Operativo</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Fecha Próx Mantenimiento</th>
                        <th className="px-5 py-3 text-center text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(255,255,255,0.03)] text-xs font-display">
                      {filtered.equipos.length > 0 ? (
                        filtered.equipos.map((eq) => (
                          <tr key={eq.id} className="hover:bg-[rgba(0,229,255,0.02)] transition">
                            <td className="px-5 py-3.5 font-mono text-[#64748b] font-semibold">#{eq.id}</td>
                            <td className="px-5 py-3.5 text-white font-bold">{eq.nombre_equipo}</td>
                            <td className="px-5 py-3.5">
                              <span className="bg-[#1a2236] border border-[#00e5ff]/20 text-[#00e5ff] text-[10px] font-mono px-2 py-0.5 rounded-full font-medium">
                                {eq.tipo_equipo}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              {eq.estado === 'Activo' && (
                                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  {eq.estado}
                                </span>
                              )}
                              {eq.estado === 'En mantenimiento' && (
                                <span className="inline-flex items-center gap-1.5 bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                                  {eq.estado}
                                </span>
                              )}
                              {eq.estado !== 'Activo' && eq.estado !== 'En mantenimiento' && (
                                <span className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                  {eq.estado}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-gray-300">{eq.fecha_mantenimiento}</td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenForm('equipo', eq.id)}
                                  className="p-1.5 bg-[#1f2937] hover:bg-gray-700 text-gray-200 hover:text-[#00e5ff] rounded-lg transition cursor-pointer"
                                  title="Editar"
                                >
                                  <PenSquare className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRecord('equipos', eq.id)}
                                  className="p-1.5 bg-[#ef4444]/15 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-5 py-12 text-center text-[#64748b] font-mono">
                            No se encontraron equipos que coincidan con los filtros
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}


          {/* ══ VIEW: SERVICIOS ══ */}
          {activeTab === 'servicios' && (
            <div className="space-y-5">
              
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="w-full sm:flex-1 relative">
                  <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="🔍 Buscar servicios por nombre, tarifa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#111827] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#e2e8f0] outline-none transition"
                  />
                </div>
                <button
                  onClick={() => handleOpenForm('servicio')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00e5ff] text-black hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition rounded-lg text-xs font-extrabold cursor-pointer h-[40px]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Nuevo Servicio</span>
                </button>
              </div>

              <div className="bg-[#111827] border border-[rgba(0,229,255,0.12)] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-[rgba(0,229,255,0.12)] flex items-center justify-between">
                  <div>
                    <h4 className="text-white text-sm font-bold">Catálogo de Servicios</h4>
                    <p className="text-[#64748b] text-[11px] font-mono mt-0.5">Control de tarifas de internet, copias e impresiones</p>
                  </div>
                  <span className="bg-[#1a2236] border border-[rgba(0,229,255,0.12)] text-[#64748b] text-[11px] font-mono px-3 py-1 rounded-lg">
                    {filtered.servicios.length} servicio(s)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-[rgba(0,229,255,0.12)] bg-white/[0.01]">
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">ID</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Servicio ofertado</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Descripción</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Tarifa / Costo unitario</th>
                        <th className="px-5 py-3 text-center text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(255,255,255,0.03)] text-xs font-display">
                      {filtered.servicios.length > 0 ? (
                        filtered.servicios.map((s) => (
                          <tr key={s.id} className="hover:bg-[rgba(0,229,255,0.02)] transition">
                            <td className="px-5 py-3.5 font-mono text-[#64748b] font-semibold">#{s.id}</td>
                            <td className="px-5 py-3.5 text-white font-bold">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-[rgba(0,229,255,0.15)] bg-[#1a2236] flex-shrink-0 shadow-[0_0_8px_rgba(0,229,255,0.05)]">
                                  <img 
                                    src={getServiceImageUrl(s.nombre_servicio)} 
                                    alt={s.nombre_servicio} 
                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <span className="tracking-tight">{s.nombre_servicio}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-[#e2e8f0]/80">{s.descripcion || 'Sin descripción'}</td>
                            <td className="px-5 py-3.5">
                              <span className="text-[#10b981] font-mono font-extrabold text-sm">
                                {formatCurrency(s.precio)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenForm('servicio', s.id)}
                                  className="p-1.5 bg-[#1f2937] hover:bg-gray-700 text-gray-200 hover:text-[#00e5ff] rounded-lg transition cursor-pointer"
                                  title="Editar"
                                >
                                  <PenSquare className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRecord('servicios', s.id)}
                                  className="p-1.5 bg-[#ef4444]/15 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-5 py-12 text-center text-[#64748b] font-mono">
                            No se encontraron servicios que coincidan con la búsqueda
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}


          {/* ══ VIEW: VENTAS ══ */}
          {activeTab === 'ventas' && (
            <div className="space-y-5">
              
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="w-full sm:flex-1 relative">
                  <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="🔍 Buscar ventas por fecha, cliente o cajero..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#111827] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#e2e8f0] outline-none transition"
                  />
                </div>
                <button
                  onClick={() => handleOpenForm('venta')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00e5ff] text-black hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition rounded-lg text-xs font-extrabold cursor-pointer h-[40px]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Registrar Venta</span>
                </button>
              </div>

              <div className="bg-[#111827] border border-[rgba(0,229,255,0.12)] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-[rgba(0,229,255,0.12)] flex items-center justify-between">
                  <div>
                    <h4 className="text-white text-sm font-bold">Bitácora de Ventas</h4>
                    <p className="text-[#64748b] text-[11px] font-mono mt-0.5">Listado maestro de transacciones y cierres de caja</p>
                  </div>
                  <span className="bg-[#1a2236] border border-[rgba(0,229,255,0.12)] text-[#64748b] text-[11px] font-mono px-3 py-1 rounded-lg">
                    {filtered.ventas.length} transaccione(s)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-[rgba(0,229,255,0.12)] bg-white/[0.01]">
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Nº Fact</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Fecha Emisión</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Cliente pagador</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Cajero Operador</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Monto Total ($)</th>
                        <th className="px-5 py-3 text-center text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(255,255,255,0.03)] text-xs font-display">
                      {filtered.ventas.length > 0 ? (
                        filtered.ventas.map((v) => {
                          const cliObj = db.clientes.find(c => c.id === v.id_cliente);
                          const empObj = db.empleados.find(e => e.id === v.id_empleado);
                          return (
                            <tr key={v.id} className="hover:bg-[rgba(0,229,255,0.02)] transition">
                              <td className="px-5 py-3.5 font-mono text-[#00e5ff] font-extrabold">#00{v.id}</td>
                              <td className="px-5 py-3.5 font-mono text-gray-300">{v.fecha_venta}</td>
                              <td className="px-5 py-3.5 text-white font-bold">
                                {cliObj ? `${cliObj.nombres} ${cliObj.apellidos}` : <span className="text-[#64748b] italic">Usuario General</span>}
                              </td>
                              <td className="px-5 py-3.5 text-gray-300">
                                {empObj ? `${empObj.nombres} ${empObj.apellidos}` : <span className="text-red-400">Sin asignar</span>}
                              </td>
                              <td className="px-5 py-3.5 font-mono text-[#10b981] font-extrabold text-sm">
                                {formatCurrency(v.total)}
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenForm('venta', v.id)}
                                    className="p-1.5 bg-[#1f2937] hover:bg-gray-700 text-gray-200 hover:text-[#00e5ff] rounded-lg transition cursor-pointer"
                                    title="Editar"
                                  >
                                    <PenSquare className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRecord('ventas', v.id)}
                                    className="p-1.5 bg-[#ef4444]/15 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition cursor-pointer"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-5 py-12 text-center text-[#64748b] font-mono">
                            No se encontraron cabeceras de ventas registradas
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}


          {/* ══ VIEW: DETALLE VENTAS ══ */}
          {activeTab === 'detalle' && (
            <div className="space-y-5">
              
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="w-full sm:flex-1 relative">
                  <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="🔍 Buscar detalles por ID venta, servicio, cantidad, subtotal..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#111827] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#e2e8f0] outline-none transition"
                  />
                </div>
                <button
                  onClick={() => handleOpenForm('detalle')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00e5ff] text-black hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition rounded-lg text-xs font-extrabold cursor-pointer h-[40px]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Agregar Detalle</span>
                </button>
              </div>

              <div className="bg-[#111827] border border-[rgba(0,229,255,0.12)] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-[rgba(0,229,255,0.12)] flex items-center justify-between">
                  <div>
                    <h4 className="text-white text-sm font-bold">Detalle Analítico de Facturación</h4>
                    <p className="text-[#64748b] text-[11px] font-mono mt-0.5">Control pormenorizado de servicios prestados por factura</p>
                  </div>
                  <span className="bg-[#1a2236] border border-[rgba(0,229,255,0.12)] text-[#64748b] text-[11px] font-mono px-3 py-1 rounded-lg">
                    {filtered.detalle.length} línea(s)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-[rgba(0,229,255,0.12)] bg-white/[0.01]">
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">ID Detalle</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">ID Venta (Nº Fact)</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Servicio Consumido</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Cantidad</th>
                        <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Subtotal ($)</th>
                        <th className="px-5 py-3 text-center text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(255,255,255,0.03)] text-xs font-display">
                      {filtered.detalle.length > 0 ? (
                        filtered.detalle.map((d) => {
                          const srvObj = db.servicios.find(s => s.id === d.id_servicio);
                          return (
                            <tr key={d.id} className="hover:bg-[rgba(0,229,255,0.02)] transition">
                              <td className="px-5 py-3.5 font-mono text-[#64748b] font-semibold">#{d.id}</td>
                              <td className="px-5 py-3.5 font-mono text-[#00e5ff] font-bold">#00{d.id_venta}</td>
                              <td className="px-5 py-3.5 text-white font-bold">
                                {srvObj ? srvObj.nombre_servicio : <span className="text-red-400">Servicio Eliminado</span>}
                              </td>
                              <td className="px-5 py-3.5 font-mono text-gray-300 font-bold">{d.cantidad} un.</td>
                              <td className="px-5 py-3.5 font-mono text-[#10b981] font-extrabold text-sm">
                                {formatCurrency(d.subtotal)}
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenForm('detalle', d.id)}
                                    className="p-1.5 bg-[#1f2937] hover:bg-gray-700 text-gray-200 hover:text-[#00e5ff] rounded-lg transition cursor-pointer"
                                    title="Editar"
                                  >
                                    <PenSquare className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRecord('detalle', d.id)}
                                    className="p-1.5 bg-[#ef4444]/15 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition cursor-pointer"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-5 py-12 text-center text-[#64748b] font-mono">
                            No se encontraron especificaciones detalladas
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* Botón flotante de WhatsApp */}
      <a
        href="https://wa.me/593980777863?text=Hola%20Mayer!%20Necesito%20asistencia%20con%20el%20sistema%20Cyber%20Roy."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[190] bg-[#25D366] hover:bg-[#20ba59] text-white p-3.5 rounded-full shadow-[0_0_20px_rgba(37,211,102,0.5)] transition-all duration-300 hover:scale-110 flex items-center justify-center group"
        title="Contactar Administrador (Mayer) por WhatsApp"
        id="whatsapp-floating-button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6 animate-pulse"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.059 5.348 5.397.01 12.008.01c3.202.001 6.212 1.248 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.731-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.488 2.01 14.07 1 11.645 1c-5.449 0-9.882 4.372-9.886 9.801-.001 1.745.474 3.447 1.378 4.96l-.973 3.555 3.644-.954zm12.352-7.394c-.29-.145-1.72-.85-1.985-.947-.267-.097-.461-.146-.656.146-.195.29-.755.947-.925 1.141-.17.194-.34.218-.63.073-.29-.145-1.229-.453-2.34-1.445-.865-.772-1.45-1.725-1.62-2.016-.17-.29-.018-.447.127-.591.13-.13.29-.34.436-.51.145-.17.194-.291.291-.485.097-.194.049-.364-.024-.51-.074-.146-.656-1.579-.902-2.162-.24-.575-.48-.497-.657-.506-.17-.008-.364-.01-.559-.01-.195 0-.51.073-.778.364s-1.02 1.02-1.02 2.484 1.069 2.88 1.215 3.074c.146.195 2.105 3.23 5.099 4.52.712.307 1.27.49 1.7.63.717.227 1.37.195 1.887.118.575-.085 1.723-.704 1.964-1.385.242-.68.242-1.261.17-1.383-.073-.12-.267-.194-.557-.339z" />
        </svg>
        
        {/* Tooltip on hover */}
        <span className="absolute right-14 bg-[#111827] text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-[rgba(0,229,255,0.2)] shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none font-mono">
          💬 Soporte WhatsApp (+593980777863)
        </span>
      </a>

      {/* Structured CRUD Forms Modals container */}
      <ManagementModal
        isOpen={isModalOpen}
        type={modalType}
        editingId={editingId}
        db={db}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
        }}
        onSave={handleSaveForm}
      />
    </div>
  );
}
