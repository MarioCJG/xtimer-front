import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private apiUrl = 'http://localhost:3000';
  private User = '/api/usuarios';
  private finalUrl = this.apiUrl + this.User;

  constructor(private http: HttpClient) {}

  getUsuarios(): Observable<any> {
    return this.http.get(this.finalUrl);
  }

  // Obtener usuario por ID
  getUsuarioById(id: number): Observable<any> {
    return this.http.get(`${this.finalUrl}/${id}`);
  }
}
