import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { HorasExtraService } from '../../services/horas-extra.service';
import { CommonModule } from '@angular/common';
import { DarkModeService } from '../../services/dark-mode.service';


@Component({
    selector: 'app-aprobaciones',
    standalone: true,
    templateUrl: './aprobaciones.component.html',
    styleUrls: ['./aprobaciones.component.css'],
    encapsulation: ViewEncapsulation.None,
    imports: [CommonModule]
})
export class AprobacionesComponent implements OnInit {
    horasPendientes: any[] = [];
    idAprobador: number = 1; // Aquí debes obtener dinámicamente el ID del usuario autenticado

    constructor(private horasExtraService: HorasExtraService, public darkModeService: DarkModeService) { }

    ngOnInit() {
        this.cargarHorasPendientes();

        this.darkModeService.aplicarModo();
    }

    cargarHorasPendientes() {
        this.horasExtraService.obtenerHorasExtra().subscribe(
            res => {
                this.horasPendientes = res.filter(hora => hora.estado === 'pendiente');
            },
            err => { console.error('❌ Error al cargar horas pendientes:', err); }
        );
    }

    aprobarHoraExtra(id: number) {
        this.actualizarEstadoHoraExtra(id, 'aprobado');
    }

    rechazarHoraExtra(id: number) {
        this.actualizarEstadoHoraExtra(id, 'rechazado');
    }

    actualizarEstadoHoraExtra(id: number, nuevoEstado: string) {
        this.horasExtraService.actualizarEstado(id, nuevoEstado, this.idAprobador).subscribe(
            res => {
                console.log(`✅ Hora extra marcada como ${nuevoEstado}:`, res);
                this.cargarHorasPendientes(); // Recargar lista de horas pendientes
            },
            err => { console.error(`❌ Error al cambiar estado a ${nuevoEstado}:`, err); }
        );
    }




}