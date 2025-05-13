import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { HorasExtraService } from '../../services/horas-extra.service';
import { CommonModule } from '@angular/common';
import { DarkModeService } from '../../services/dark-mode.service';
import { FormsModule } from '@angular/forms';

import Swal from 'sweetalert2';


@Component({
    selector: 'app-aprobaciones',
    standalone: true,
    templateUrl: './aprobaciones.component.html',
    styleUrls: ['./aprobaciones.component.css'],
    encapsulation: ViewEncapsulation.None,
    imports: [CommonModule, FormsModule]
})
export class AprobacionesComponent implements OnInit {

    horasPendientes: any[] = [];
    idAprobador: number = 1; // Aquí debes obtener dinámicamente el ID del usuario autenticado

    resumenHoras: any[] = []; // Inicializar la variable para almacenar el resumen de horas
    horasFiltradas: any[] = []; // Inicializar la variable para almacenar el resumen de horas

    detallesHorasExtra: any[] = []; // Variable para almacenar los detalles de horas extra
    comentarios: any[] = []; // Variable para almacenar los detalles de horas extra

    filtroCargo: string = ''; // Filtro para el cargo
    filtroArea: string = ''; // Filtro para el área
    filtroConsultor: string = ''; // Filtro para el nombre del consultor

    opcionesCargo: string[] = []; // Opciones únicas para el filtro de cargo
    opcionesArea: string[] = []; // Opciones únicas para el filtro de área
    opcionesConsultor: string[] = []; // Opciones únicas para el filtro de consultores

    celdaSeleccionada: number | null = null; // Variable para almacenar el ID de la celda seleccionada

    constructor(private horasExtraService: HorasExtraService, public darkModeService: DarkModeService) { }

    ngOnInit() {
        this.cargarHorasPendientes();

        this.darkModeService.aplicarModo();
        this.cargarResumenHoras(); // Cargar el resumen de horas al iniciar el componente
    }



    imprimirId(id_resumen: number, fecha: string) {
        console.log('ID Resumen seleccionado:', id_resumen);
        console.log('Fecha seleccionada (original):', fecha);

        // Actualizar la celda seleccionada
        this.celdaSeleccionada = id_resumen;

        // Convertir fecha de "dd-MM-yyyy" a "yyyy-MM-dd"
        const [dia, mes, anio] = fecha.split('-');
        const fechaFormateada = `${anio}-${mes}-${dia}`;
        console.log('Fecha formateada:', fechaFormateada);

        // Obtener los detalles de horas extra
        this.horasExtraService.obtenerHorasPorResumen(id_resumen).subscribe(
            res => {
                console.log('Detalles de horas extra:', res);
                this.detallesHorasExtra = res.map((detalle: any) => ({
                    proyecto_completo: detalle.proyecto_completo,
                    hora_inicio: detalle.hora_inicio,
                    hora_fin: detalle.hora_fin
                }));
                console.log('Detalles de horas extra guardados:', this.detallesHorasExtra);

                if (fechaFormateada) {
                    this.horasExtraService.obtenerComentariosPorResumen(id_resumen, fechaFormateada).subscribe(
                        res => {
                            console.log('>Comentarios obtenidos:', res);
                            this.comentarios = res.map((comentario: any) => ({
                                proyecto_nombre: comentario.proyecto_nombre,
                                comentario: comentario.comentario,
                            }));
                            console.log('Comentarios obtenidos:', this.comentarios);
                        },
                        err => {
                            console.error('❌ Error al obtener comentarios:', err);
                        }
                    );
                } else {
                    console.warn('⚠ No se encontró una fecha válida en los detalles.');
                }
            },
            err => {
                console.error('❌ Error al obtener detalles de horas extra:', err);
            }
        );
    }

    cargarResumenHoras() {
        this.horasExtraService.obtenerResumenHoras().subscribe(
            res => {
                console.log('Datos recibidos del backend:', res);

                // Filtrar las horas con horas_extras > 0 y aprobacion == 'pendiente'
                this.resumenHoras = res.filter(hora =>
                    !isNaN(parseFloat(hora.horas_extras)) &&
                    parseFloat(hora.horas_extras) > 0 &&
                    hora.aprobacion?.trim().toLowerCase() === 'pendiente'
                );

                // No es necesario convertir la fecha, ya que viene en formato ISO 8601
                this.horasFiltradas = [...this.resumenHoras];
                console.log('Resumen de horas filtradas:', this.horasFiltradas);

                // Generar opciones únicas para los filtros
                this.opcionesCargo = [...new Set(this.resumenHoras.map(hora => hora.cargo_nombre))];
                this.opcionesArea = [...new Set(this.resumenHoras.map(hora => hora.area_nombre))];
                this.opcionesConsultor = [...new Set(this.resumenHoras.map(hora => hora.consultor_nombre))];

                console.log('Opciones de cargo:', this.opcionesCargo);
                console.log('Opciones de área:', this.opcionesArea);
                console.log('Opciones de consultores:', this.opcionesConsultor);
            },
            err => {
                console.error('❌ Error al cargar resumen de horas:', err);
            }
        );
    }

    aplicarFiltros() {
        // Comenzar con todos los datos cargados en resumenHoras
        let filtradas = [...this.resumenHoras];

        // Aplicar filtro por cargo si está definido
        if (this.filtroCargo) {
            filtradas = filtradas.filter(hora => hora.cargo_nombre === this.filtroCargo);
        }

        // Aplicar filtro por área si está definido
        if (this.filtroArea) {
            filtradas = filtradas.filter(hora => hora.area_nombre === this.filtroArea);
        }

        // Aplicar filtro por nombre del consultor si está definido
        if (this.filtroConsultor) {
            filtradas = filtradas.filter(hora => hora.consultor_nombre === this.filtroConsultor);
        }

        // Actualizar la variable horasFiltradas
        this.horasFiltradas = filtradas;
        console.log('Horas filtradas:', this.horasFiltradas);
    }

    cargarHorasPendientes() {
        this.horasExtraService.obtenerHorasExtra().subscribe(
            res => {
                this.horasPendientes = res.filter(hora => hora.estado === 'pendiente');
            },
            err => { console.error('❌ Error al cargar horas pendientes:', err); }
        );
    }
    aprobarHoraExtra(id_resumen: number) {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¿Deseas aprobar esta hora extra?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, aprobar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.horasExtraService.actualizarAprobacion(id_resumen, 'aprobado').subscribe(
                    res => {
                        Swal.fire(
                            '¡Aprobado!',
                            'La hora extra ha sido aprobada con éxito.',
                            'success'
                        );
                        this.cargarResumenHoras(); // Recargar los datos después de la actualización
                    },
                    err => {
                        Swal.fire(
                            'Error',
                            'Ocurrió un error al aprobar la hora extra.',
                            'error'
                        );
                        console.error('❌ Error al aprobar la hora extra:', err);
                    }
                );
            }
        });
    }

    rechazarHoraExtra(id_resumen: number) {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¿Deseas rechazar esta hora extra?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, rechazar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.horasExtraService.actualizarAprobacion(id_resumen, 'rechazado').subscribe(
                    res => {
                        Swal.fire(
                            '¡Rechazado!',
                            'La hora extra ha sido rechazada con éxito.',
                            'success'
                        );
                        this.cargarResumenHoras(); // Recargar los datos después de la actualización
                    },
                    err => {
                        Swal.fire(
                            'Error',
                            'Ocurrió un error al rechazar la hora extra.',
                            'error'
                        );
                        console.error('❌ Error al rechazar la hora extra:', err);
                    }
                );
            }
        });
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