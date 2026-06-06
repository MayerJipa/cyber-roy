import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { X, Save } from 'lucide-react';
import { DBState, Cliente, Empleado, Equipo, Servicio, Venta, DetalleVenta } from '../types';

interface ManagementModalProps {
  isOpen: boolean;
  type: 'cliente' | 'empleado' | 'equipo' | 'servicio' | 'venta' | 'detalle';
  editingId: number | null;
  db: DBState;
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function ManagementModal({
  isOpen,
  type,
  editingId,
  db,
  onClose,
  onSave,
}: ManagementModalProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Unified form state representation
  const [formData, setFormData] = useState<any>({});

  // Reset form when modal opens, switches type, or switches edit targets
  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);

    if (editingId !== null) {
      // Find matching item to edit
      let existingRecord: any = null;
      if (type === 'cliente') existingRecord = db.clientes.find(c => c.id === editingId);
      if (type === 'empleado') existingRecord = db.empleados.find(e => e.id === editingId);
      if (type === 'equipo') existingRecord = db.equipos.find(eq => eq.id === editingId);
      if (type === 'servicio') existingRecord = db.servicios.find(s => s.id === editingId);
      if (type === 'venta') existingRecord = db.ventas.find(v => v.id === editingId);
      if (type === 'detalle') existingRecord = db.detalle.find(d => d.id === editingId);

      if (existingRecord) {
        setFormData({ ...existingRecord });
      } else {
        setFormData({});
      }
    } else {
      // Initialize with smart default empty values
      const today = new Date().toISOString().split('T')[0];
      if (type === 'cliente') {
        setFormData({ nombres: '', apellidos: '', cedula: '', telefono: '', correo: '', direccion: '' });
      } else if (type === 'empleado') {
        setFormData({ nombres: '', apellidos: '', cargo: 'Cajera', telefono: '', correo: '' });
      } else if (type === 'equipo') {
        setFormData({ nombre_equipo: '', tipo_equipo: 'Desktop', estado: 'Activo', fecha_mantenimiento: today });
      } else if (type === 'servicio') {
        setFormData({ nombre_servicio: '', descripcion: '', precio: 0.50 });
      } else if (type === 'venta') {
        const clientDefault = db.clientes[0]?.id || 0;
        const empDefault = db.empleados[0]?.id || 0;
        setFormData({ fecha_venta: today, id_cliente: clientDefault, id_empleado: empDefault, total: 1.00 });
      } else if (type === 'detalle') {
        const saleDefault = db.ventas[0]?.id || 0;
        const srvDefault = db.servicios[0]?.id || 0;
        const srvObj = db.servicios.find(s => s.id === srvDefault);
        const price = srvObj ? srvObj.precio : 0.00;
        setFormData({ id_venta: saleDefault, id_servicio: srvDefault, cantidad: 1, subtotal: price });
      }
    }
  }, [isOpen, type, editingId, db]);

  // Dynamic automatic subtotals logic for 'detalle' entries
  useEffect(() => {
    if (type === 'detalle' && formData.id_servicio && formData.cantidad !== undefined) {
      const selectedService = db.servicios.find(s => s.id === Number(formData.id_servicio));
      if (selectedService) {
        const computedSubtotal = parseFloat((selectedService.precio * Number(formData.cantidad)).toFixed(2));
        if (formData.subtotal !== computedSubtotal) {
          setFormData((prev: any) => ({ ...prev, subtotal: computedSubtotal }));
        }
      }
    }
  }, [formData.id_servicio, formData.cantidad, type, db.servicios]);

  if (!isOpen) return null;

  // Handles input triggers
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type: inputType } = e.target;
    let typedValue: any = value;

    if (inputType === 'number') {
      typedValue = parseFloat(value) || 0;
    } else if (name === 'id_cliente' || name === 'id_empleado' || name === 'id_venta' || name === 'id_servicio' || name === 'cantidad') {
      typedValue = parseInt(value, 10) || 0;
    }

    setFormData((prev: any) => ({
      ...prev,
      [name]: typedValue
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Validation checks
    if (type === 'cliente') {
      if (!formData.nombres?.trim() || !formData.apellidos?.trim()) {
        setErrorMsg('Por favor introduce nombres y apellidos del cliente.');
        return;
      }
      if (!formData.cedula?.trim()) {
        setErrorMsg('La cédula de identidad es obligatoria.');
        return;
      }
    } else if (type === 'empleado') {
      if (!formData.nombres?.trim() || !formData.apellidos?.trim()) {
        setErrorMsg('Por favor introduce nombres y apellidos de la persona.');
        return;
      }
    } else if (type === 'equipo') {
      if (!formData.nombre_equipo?.trim()) {
        setErrorMsg('Indica el código o nombre del equipo (Ej: PC-05).');
        return;
      }
    } else if (type === 'servicio') {
      if (!formData.nombre_servicio?.trim()) {
        setErrorMsg('El nombre de servicio es requerido.');
        return;
      }
      if (formData.precio <= 0) {
        setErrorMsg('Asigna un precio unitario mayor a cero.');
        return;
      }
    } else if (type === 'venta') {
      if (!formData.id_cliente || !formData.id_empleado) {
        setErrorMsg('Debes asignar un cliente y cajero empleado.');
        return;
      }
    } else if (type === 'detalle') {
      if (formData.cantidad <= 0) {
        setErrorMsg('La cantidad debe ser mínimo 1.');
        return;
      }
    }

    onSave(formData);
  };

  // Titles dictionary
  const modalTitles = {
    cliente: { add: '👤 Nuevo Cliente', edit: '✏️ Editar Datos de Cliente' },
    empleado: { add: '👷 Registrar Nuevo Empleado', edit: '✏️ Actualizar Cargo de Empleado' },
    equipo: { add: '🖥️ Agregar Equipo al Inventario', edit: '✏️ Configurar Estado del Equipo' },
    servicio: { add: '⚙️ Ofertar Nuevo Servicio', edit: '✏️ Modificar Servicio del Catálogo' },
    venta: { add: '💰 Generar Nueva Venta', edit: '✏️ Reajustar Cabecera de Venta' },
    detalle: { add: '📋 Adicionar Línea de Detalle', edit: '✏️ Corregir Cantidad de Detalle' },
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-opacity duration-300"
    >
      <div className="bg-[#1a2236] border border-[rgba(0,229,255,0.18)] rounded-2xl w-full max-w-[520px] shadow-[0_0_50px_rgba(0,229,255,0.15)] flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header container */}
        <div className="flex items-center justify-between p-5 border-b border-[rgba(0,229,255,0.12)] bg-[#111827]">
          <h3 className="text-white text-base md:text-lg font-extrabold flex items-center gap-2">
            {editingId !== null ? modalTitles[type].edit : modalTitles[type].add}
          </h3>
          <button
            onClick={onClose}
            className="text-[#64748b] hover:text-[#00e5ff] p-1.5 rounded-lg hover:bg-[#1f2937] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & form fields */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="bg-red-500/15 border border-red-500/35 text-red-300 text-xs px-3.5 py-2.5 rounded-lg font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* ━━ CLIENTE FIELDS ━━ */}
            {type === 'cliente' && (
              <>
                <div className="flex flex-col gap-1 sm:col-span-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Nombres</label>
                  <input
                    type="text"
                    name="nombres"
                    required
                    value={formData.nombres || ''}
                    onChange={handleChange}
                    placeholder="Ej: Marcelo"
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Apellidos</label>
                  <input
                    type="text"
                    name="apellidos"
                    required
                    value={formData.apellidos || ''}
                    onChange={handleChange}
                    placeholder="Ej: Jipa"
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Cédula</label>
                  <input
                    type="text"
                    name="cedula"
                    required
                    value={formData.cedula || ''}
                    onChange={handleChange}
                    placeholder="0805561234"
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Teléfono</label>
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono || ''}
                    onChange={handleChange}
                    placeholder="0992381234"
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Correo Electrónico</label>
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo || ''}
                    onChange={handleChange}
                    placeholder="marcelo@mail.com"
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Dirección</label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion || ''}
                    onChange={handleChange}
                    placeholder="Av. Amazonas y Colón 456"
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none"
                  />
                </div>
              </>
            )}

            {/* ━━ EMPLEADO FIELDS ━━ */}
            {type === 'empleado' && (
              <>
                <div className="flex flex-col gap-1 sm:col-span-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Nombres</label>
                  <input
                    type="text"
                    name="nombres"
                    required
                    value={formData.nombres || ''}
                    onChange={handleChange}
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Apellidos</label>
                  <input
                    type="text"
                    name="apellidos"
                    required
                    value={formData.apellidos || ''}
                    onChange={handleChange}
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Cargo / Rol</label>
                  <select
                    name="cargo"
                    value={formData.cargo || 'Cajera'}
                    onChange={handleChange}
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none"
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Cajera">Cajera/Cajero</option>
                    <option value="Técnico">Técnico Redes</option>
                    <option value="Auxiliar">Auxiliar Técnico</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Teléfono</label>
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono || ''}
                    onChange={handleChange}
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Correo Electrónico</label>
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo || ''}
                    onChange={handleChange}
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none"
                  />
                </div>
              </>
            )}

            {/* ━━ EQUIPO FIELDS ━━ */}
            {type === 'equipo' && (
              <>
                <div className="flex flex-col gap-1 sm:col-span-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Nombre / Código</label>
                  <input
                    type="text"
                    name="nombre_equipo"
                    required
                    value={formData.nombre_equipo || ''}
                    onChange={handleChange}
                    placeholder="Ej: PC-05"
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Tipo de Dispositivo</label>
                  <select
                    name="tipo_equipo"
                    value={formData.tipo_equipo || 'Desktop'}
                    onChange={handleChange}
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none"
                  >
                    <option value="Desktop">Familiar / Desktop</option>
                    <option value="Laptop">Portátil / Laptop</option>
                    <option value="Impresora">Impresora Láser</option>
                    <option value="Periférico">Escáner / Periférico</option>
                    <option value="Router">Módem / Router Red</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Estado Operativo</label>
                  <select
                    name="estado"
                    value={formData.estado || 'Activo'}
                    onChange={handleChange}
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none"
                  >
                    <option value="Activo">🟢 Activo / Libre</option>
                    <option value="En mantenimiento">🟡 En mantenimiento</option>
                    <option value="Inactivo">🔴 Inactivo / Reparar</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Próxima Fecha de Mantenimiento</label>
                  <input
                    type="date"
                    name="fecha_mantenimiento"
                    value={formData.fecha_mantenimiento || ''}
                    onChange={handleChange}
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none font-mono"
                  />
                </div>
              </>
            )}

            {/* ━━ SERVICIO FIELDS ━━ */}
            {type === 'servicio' && (
              <>
                <div className="flex flex-col gap-1 sm:col-span-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Nombre de Servicio</label>
                  <input
                    type="text"
                    name="nombre_servicio"
                    required
                    value={formData.nombre_servicio || ''}
                    onChange={handleChange}
                    placeholder="Ej: Internet por hora, Café..."
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Precio Unitario ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="precio"
                    required
                    value={formData.precio !== undefined ? formData.precio : ''}
                    onChange={handleChange}
                    placeholder="0.75"
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Descripción</label>
                  <input
                    type="text"
                    name="descripcion"
                    value={formData.descripcion || ''}
                    onChange={handleChange}
                    placeholder="Descripción resumida..."
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none"
                  />
                </div>
              </>
            )}

            {/* ━━ VENTA FIELDS ━━ */}
            {type === 'venta' && (
              <>
                <div className="flex flex-col gap-1 sm:col-span-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Fecha Venta</label>
                  <input
                    type="date"
                    name="fecha_venta"
                    required
                    value={formData.fecha_venta || ''}
                    onChange={handleChange}
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Monto Total ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="total"
                    required
                    value={formData.total !== undefined ? formData.total : ''}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Pagar a Cuenta del Cliente</label>
                  <select
                    name="id_cliente"
                    value={formData.id_cliente || ''}
                    onChange={handleChange}
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none"
                  >
                    <option value="">-- Seleccionar Cliente --</option>
                    {db.clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nombres} {c.apellidos} (CI: {c.cedula})</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Atendido por (Cajero/Empleado)</label>
                  <select
                    name="id_empleado"
                    value={formData.id_empleado || ''}
                    onChange={handleChange}
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none"
                  >
                    <option value="">-- Seleccionar Cajero --</option>
                    {db.empleados.map(e => (
                      <option key={e.id} value={e.id}>{e.nombres} {e.apellidos} ({e.cargo})</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* ━━ DETALLE FIELDS ━━ */}
            {type === 'detalle' && (
              <>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Asociar a la Venta ID</label>
                  <select
                    name="id_venta"
                    required
                    value={formData.id_venta || ''}
                    onChange={handleChange}
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none font-mono"
                  >
                    <option value="">-- Seleccionar Venta --</option>
                    {db.ventas.map(v => {
                      const cliObj = db.clientes.find(c => c.id === v.id_cliente);
                      const name = cliObj ? `${cliObj.nombres} ${cliObj.apellidos}` : `ID ${v.id_cliente}`;
                      return (
                        <option key={v.id} value={v.id}>Venta #{v.id} (Total: ${v.total.toFixed(2)}) - {name}</option>
                      );
                    })}
                  </select>
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Servicio Consumido</label>
                  <select
                    name="id_servicio"
                    required
                    value={formData.id_servicio || ''}
                    onChange={handleChange}
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none"
                  >
                    <option value="">-- Seleccionar Servicio --</option>
                    {db.servicios.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre_servicio} - (${s.precio.toFixed(2)})</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 sm:col-span-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    name="amount-input" // standard generic tag
                    required
                    value={formData.cantidad !== undefined ? formData.cantidad : 1}
                    onChange={(e) => {
                      setFormData((prev: any) => ({ ...prev, cantidad: parseInt(e.target.value) || 1 }));
                    }}
                    placeholder="1"
                    className="bg-[#0a0e1a] border border-[rgba(0,229,255,0.12)] focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#e2e8f0] outline-none font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#64748b] text-[#00e5ff]">Subtotal Sugerido ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="subtotal"
                    required
                    value={formData.subtotal !== undefined ? formData.subtotal : ''}
                    onChange={handleChange}
                    placeholder="Auto-calculado"
                    className="bg-[#0a0e1a] border border-[#00e5ff]/40 focus:border-[#00e5ff] rounded-lg p-2.5 text-sm text-[#00e5ff] font-extrabold outline-none font-mono"
                  />
                  <span className="text-[9px] text-[#64748b] font-mono block mt-1">Multiplicación de tarifa x cantidad</span>
                </div>
              </>
            )}

          </div>

          {/* Footer controls inside modal */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(0,229,255,0.12)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#1f2937] text-white hover:bg-gray-700 transition rounded-lg text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#00e5ff] text-black hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition rounded-lg text-xs font-extrabold cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{editingId !== null ? 'Actualizar' : 'Guardar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
