import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HorasExtra } from '../models/hora-extra.model';

@Injectable({
    providedIn: 'root'
})
export class HorasExtraService {
    private apiUrl = 'http://localhost:3000/api';

    constructor(private http: HttpClient) { }

    obtenerProyectos(): Observable<any> {
        return this.http.get(`${this.apiUrl}/proyectos`);
    }

    registrarHorasExtra(datos: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/horas-extra`, datos);
    }

    obtenerHorasExtra(): Observable<HorasExtra[]> {
        return this.http.get<HorasExtra[]>(`${this.apiUrl}/horas-extra`);
    }

    obtenerHorasExtraPorUsuario(id_usuario: number) {
        return this.http.get<any[]>(`http://localhost:3000/api/horas-extra/${id_usuario}`);
    }

    editarHorasExtra(hora: HorasExtra): Observable<any> {
        return this.http.put(`${this.apiUrl}/horas-extra/${hora.id}`, hora);
    }

    eliminarHorasExtra(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/horas-extra/${id}`);
    }

    eliminarHorasPorUsuarioYFecha(id_usuario: number, fecha: string) {
        const url = `${this.apiUrl}/horas-extra/eliminar-por-usuario-y-fecha`; // Ajusta la URL según tu backend
        return this.http.delete(`${url}?id_usuario=${id_usuario}&fecha=${fecha}`);
    }

    guardarResumenHoras(datos: { id_usuario: number; fecha: string; total_horas: number; horas_extras: number }) {
        return this.http.post(`${this.apiUrl}/resumen/guardar-resumen`, datos);
    }

    buscarResumenHoras(id_usuario: number, fecha: string) {
        return this.http.get(`${this.apiUrl}/resumen/buscar-resumen`, {
            params: { id_usuario: id_usuario.toString(), fecha }
        });
    }

    obtenerResumenPorUsuario(id_usuario: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/resumen/${id_usuario}`);
    }

    actualizarResumenHoras(datos: { id_usuario: number; fecha: string; total_horas: number; horas_extras: number }) {
        return this.http.put(`${this.apiUrl}/resumen/actualizar-resumen`, datos);
    }

    guardarComentario(datos: { id_proyecto: number; fecha: string; comentario: string; id_usuario: number }): Observable<any> {
        return this.http.post(`${this.apiUrl}/comentarios`, datos);
    }

    obtenerComentarios(id_proyecto: number, fecha: string, id_usuario: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/comentarios`, {
            params: {
                id_proyecto: id_proyecto.toString(),
                fecha,
                id_usuario: id_usuario.toString()
            }
        });
    }


    /**
     * Actualiza el estado de una hora extra.
     * @param id - ID de la hora extra.
     * @param estado - Nuevo estado (pendiente, aprobado, rechazado).
     * @param idAprobador - ID del usuario que realiza la acción.
     */
    actualizarEstado(id: number, estado: string, idAprobador: number): Observable<any> {
        const datos = { estado, id_aprobador: idAprobador };
        return this.http.put(`${this.apiUrl}/horas-extra/${id}`, datos);
    }

    obtenerProyectosAsignados(id_usuario: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/proyectos/asignados/${id_usuario}`);
    }
}