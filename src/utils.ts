import { Cliente, Empleado, Equipo, Servicio, Venta, DetalleVenta } from './types';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export function exportToCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function handleExportTab(
  tab: string,
  data: {
    clientes: Cliente[];
    empleados: Empleado[];
    equipos: Equipo[];
    servicios: Servicio[];
    ventas: Venta[];
    detalle: DetalleVenta[];
  }
) {
  if (tab === 'clientes') {
    const headers = ['ID', 'Nombres', 'Apellidos', 'Cédula', 'Teléfono', 'Correo', 'Dirección'];
    const rows = data.clientes.map(c => [
      String(c.id),
      c.nombres,
      c.apellidos,
      c.cedula,
      c.telefono,
      c.correo,
      c.direccion
    ]);
    exportToCSV('cyber-roy-clientes.csv', headers, rows);
  } else if (tab === 'empleados') {
    const headers = ['ID', 'Nombres', 'Apellidos', 'Cargo', 'Teléfono', 'Correo'];
    const rows = data.empleados.map(e => [
      String(e.id),
      e.nombres,
      e.apellidos,
      e.cargo,
      e.telefono,
      e.correo
    ]);
    exportToCSV('cyber-roy-empleados.csv', headers, rows);
  } else if (tab === 'equipos') {
    const headers = ['ID', 'Nombre Equipo', 'Tipo', 'Estado', 'Próximo Mantenimiento'];
    const rows = data.equipos.map(e => [
      String(e.id),
      e.nombre_equipo,
      e.tipo_equipo,
      e.estado,
      e.fecha_mantenimiento
    ]);
    exportToCSV('cyber-roy-equipos.csv', headers, rows);
  } else if (tab === 'servicios') {
    const headers = ['ID', 'Nombre Servicio', 'Descripción', 'Precio'];
    const rows = data.servicios.map(s => [
      String(s.id),
      s.nombre_servicio,
      s.descripcion,
      String(s.precio)
    ]);
    exportToCSV('cyber-roy-servicios.csv', headers, rows);
  } else if (tab === 'ventas') {
    const headers = ['ID Venta', 'Fecha', 'Cliente', 'Empleado', 'Total'];
    const rows = data.ventas.map(v => {
      const c = data.clientes.find(cli => cli.id === v.id_cliente);
      const e = data.empleados.find(emp => emp.id === v.id_empleado);
      return [
        String(v.id),
        v.fecha_venta,
        c ? `${c.nombres} ${c.apellidos}` : 'N/A',
        e ? `${e.nombres} ${e.apellidos}` : 'N/A',
        String(v.total)
      ];
    });
    exportToCSV('cyber-roy-ventas.csv', headers, rows);
  } else if (tab === 'detalle') {
    const headers = ['ID Detalle', 'ID Venta', 'Servicio', 'Cantidad', 'Subtotal'];
    const rows = data.detalle.map(d => {
      const s = data.servicios.find(ser => ser.id === d.id_servicio);
      return [
        String(d.id),
        String(d.id_venta),
        s ? s.nombre_servicio : 'N/A',
        String(d.cantidad),
        String(d.subtotal)
      ];
    });
    exportToCSV('cyber-roy-detalle-ventas.csv', headers, rows);
  } else {
    // For general export, compile a full report summary
    const headers = ['Métrica', 'Valor'];
    const rows = [
      ['Total Clientes', String(data.clientes.length)],
      ['Total Empleados', String(data.empleados.length)],
      ['Total Equipos', String(data.equipos.length)],
      ['Total Servicios', String(data.servicios.length)],
      ['Total Transacciones', String(data.ventas.length)],
      ['Ingresos Totales', String(data.ventas.reduce((acc, v) => acc + Number(v.total), 0))]
    ];
    exportToCSV('cyber-roy-resumen.csv', headers, rows);
  }
}
