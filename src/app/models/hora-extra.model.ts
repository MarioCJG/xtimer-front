export interface HorasExtra {
    id: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    total_horas: string;
    descripcion: string;
    estado: string;
    id_usuario: number;
    id_proyecto: number;
    
    // 🆕 NUEVAS PROPIEDADES:
    usuario_nombre?: string;
    usuario_apellido?: string;
    usuario_completo?: string;   // Concatenado en el frontend
    proyecto_nombre?: string;
    cliente_nombre?: string;
    proyecto_completo?: string;  // Concatenado en el frontend
}
