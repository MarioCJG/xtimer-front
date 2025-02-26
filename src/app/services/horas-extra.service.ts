import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HorasExtra } from '../models/hora-extra.model';

@Injectable({
    providedIn: 'root'
})
export class HorasExtraService {
    private apiUrl = 'http://localhost:3000/api';

    constructor(private http: HttpClient) {}

    obtenerProyectos(): Observable<any> {
        return this.http.get(`${this.apiUrl}/proyectos`);
    }

    registrarHorasExtra(datos: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/horas-extra`, datos);
    }

    obtenerHorasExtra(): Observable<HorasExtra[]> {
        return this.http.get<HorasExtra[]>(`${this.apiUrl}/horas-extra`);
    }

    editarHorasExtra(hora: HorasExtra): Observable<any> {
        return this.http.put(`${this.apiUrl}/horas-extra/${hora.id}`, hora);
    }

    eliminarHorasExtra(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/horas-extra/${id}`);
    }

    actualizarEstado(horaExtra: any) {
        return this.http.put(`${this.apiUrl}/horas-extra/${horaExtra.id}`, horaExtra);
    }
    
}
