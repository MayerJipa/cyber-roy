export interface Cliente {
  id: number;
  nombres: string;
  apellidos: string;
  cedula: string;
  telefono: string;
  correo: string;
  direccion: string;
}

export interface Empleado {
  id: number;
  nombres: string;
  apellidos: string;
  cargo: string;
  telefono: string;
  correo: string;
}

export interface Equipo {
  id: number;
  nombre_equipo: string;
  tipo_equipo: string;
  estado: string;
  fecha_mantenimiento: string;
}

export interface Servicio {
  id: number;
  nombre_servicio: string;
  descripcion: string;
  precio: number;
}

export interface Venta {
  id: number;
  fecha_venta: string;
  id_cliente: number;
  id_empleado: number;
  total: number;
}

export interface DetalleVenta {
  id: number;
  id_venta: number;
  id_servicio: number;
  cantidad: number;
  subtotal: number;
}

export interface DBState {
  clientes: Cliente[];
  empleados: Empleado[];
  equipos: Equipo[];
  servicios: Servicio[];
  ventas: Venta[];
  detalle: DetalleVenta[];
  counters: {
    clientes: number;
    empleados: number;
    equipos: number;
    servicios: number;
    ventas: number;
    detalle: number;
  };
}

export type ActiveTab = 'dashboard' | 'clientes' | 'empleados' | 'equipos' | 'servicios' | 'ventas' | 'detalle';
