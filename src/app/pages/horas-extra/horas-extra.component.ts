import { Component } from '@angular/core';
import { HorasExtraService } from '../../services/horas-extra.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FilterFechaPipe } from '../../pipes/filter-fecha.pipe';
import { FilterEstadoPipe } from '../../pipes/filter-estado.pipe';
import { HorasExtra } from '../../models/hora-extra.model';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { ViewChild } from '@angular/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { ViewEncapsulation } from '@angular/core';

import interactionPlugin from '@fullcalendar/interaction';
import { AfterViewInit } from '@angular/core';



@Component({
    selector: 'app-horas-extra',
    standalone: true,
    templateUrl: './horas-extra.component.html',
    styleUrls: ['./horas-extra.component.css'],
    encapsulation: ViewEncapsulation.None,
    imports: [FullCalendarModule, FormsModule, CommonModule, FilterFechaPipe, FilterEstadoPipe]
})
export class HorasExtraComponent implements AfterViewInit {
    @ViewChild('fullCalendar') fullCalendarComponent!: FullCalendarComponent;
    fechasMarcadas: string[] = [];
    modoOscuro = false;
    horasAgrupadas: string[] = [];
    fecha: string = '';
    horaInicio: string = '';
    horaFin: string = '';
    descripcion: string = '';
    id_usuario: number | null = null;
    id_proyecto: number | null = null;
    mensaje: string = '';
    proyectos: any[] = [];
    horasExtra: any[] = [];
    horasExtraFiltradas: any[] = [];
    filtroFecha: string = '';
    filtroEstado: string = '';
    usuarioLogueado: number | null = null;
    horaSeleccionada: HorasExtra | null = null;
    document: string = '';

    fechaDesde: string = ''; // Fecha inicial seleccionada
    fechaHasta: string = ''; // Fecha final seleccionada

    grid: { selected: boolean }[][] = [];
    isDragging: boolean = false;
    selectedCells: { row: number; col: number }[] = [];
    selectedCellsFiltradas: { row: number; col: number }[] = [];
    initialRow: number | null = null;
    horarios: string[] = []; // Lista de horarios

    semanas: number[][] = []; // Almacena las semanas calculadas
    mesActual: string = '';
    mesAnterior: string = '';
    diasSeleccionados: { dia: number; nombre: string }[] = []; // Almacena los días seleccionados con su nombre
    private diasSemanaAbreviados = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']; // Abreviaciones de los días

    mesSeleccionado: string = ''; // Almacena el mes seleccionado
    semanaSeleccionada: number | null = null; // Almacena el índice de la semana seleccionada
    diaSeleccionado: number | null = null; // Almacena el día seleccionado

    fechaSeleccionada: string = ''; // Almacena la fecha seleccionada en formato dd-mm-yyyy

    resumenHoras: any[] = [];

    calendarOptions!: CalendarOptions; 


    proyectoSeleccionadoInfo: {
        id_proyecto: number | null;
        nombre_proyecto: string | null;
        fechaSeleccionada: string | null;
        mensaje: string | null;
    } = {
            id_proyecto: null,
            nombre_proyecto: null,
            fechaSeleccionada: null,
            mensaje: null
        };

    mensajesPorProyecto: { id_proyecto: number; fecha: string; mensaje: string }[] = [];

    clientes: any[] = []; // Lista de clientes únicos
    clienteSeleccionado: string = ''; // Cliente seleccionado
    proyectosFiltrados: any[] = []; // Proyectos filtrados por cliente

    indicesProyectosFiltrados: number[] = []; // Índices de los proyectos filtrados
    copiaGrid: { selected: boolean }[][] = []; // Copia de las filas seleccionadas del grid


    constructor(private horasExtraService: HorasExtraService, private authService: AuthService) { }

    async ngOnInit() {
        document.body.classList.add('light-mode');
        this.generarHorasAgrupadas();
        this.generarHorarios();
        this.cargarProyectos();
        this.cargarHorasExtra();
        this.calcularMeses();

        this.calendarOptions = {
            plugins: [dayGridPlugin, interactionPlugin],
            initialView: 'dayGridMonth',
            events: [],
            locale: 'es',
            selectable: true,
            firstDay: 1,
            dateClick: (arg) => this.onCalendarDateClick(arg),
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: ''
            }
        };

        await this.buscarResumenHorasUsuario(); // Llamar a la función para buscar el resumen de horas del usuario

        const fechaActual = new Date();
        this.semanas = this.calcularSemanas(fechaActual.getFullYear(), fechaActual.getMonth());

        // Seleccionar el día actual
        const diaActual = fechaActual.getDate();
        const nombreDia = this.diasSemanaAbreviados[fechaActual.getDay()]; // Obtener el nombre del día
        this.seleccionarDia({ dia: diaActual, nombre: nombreDia });

        this.seleccionarMesActual();

    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            const calendarApi = this.fullCalendarComponent?.getApi();
            console.log('🧩 FullCalendar API:', calendarApi);

            if (calendarApi) {
                console.log('✅ El calendario se inicializó correctamente');
            } else {
                console.warn('⚠️ No se pudo acceder al calendario');
            }
           
            const celdas = document.querySelectorAll('.fc-daygrid-day');

            celdas.forEach((celda) => {
                celda.addEventListener('click', (event: any) => {
                    const fecha = celda.getAttribute('data-date');
                    if (fecha) {
                        console.log('🔥 CLIC MANUAL:', fecha);
                        this.onCalendarDateClick({ dateStr: fecha });
                    }
                });
            });
        }, 0);
    }

    onCalendarDateClick(arg: any): void {
        // ⚠️ Forzar la fecha como UTC para evitar desfase por zona horaria
        const partes = arg.dateStr.split('-');
        const clickedDate = new Date(Date.UTC(+partes[0], +partes[1] - 1, +partes[2]));
    
        const dia = clickedDate.getUTCDate();
        const nombreDia = this.diasSemanaAbreviados[clickedDate.getUTCDay()];
    
        const fechaFormateada = clickedDate.toISOString().split('T')[0]; // yyyy-MM-dd
    
        const semanaIndex = this.semanas.findIndex((semana) =>
            semana.includes(dia)
        );
    
        if (semanaIndex !== -1) {
            this.mostrarDiasSemana(semanaIndex);
        }
    
        this.fechasMarcadas = [fechaFormateada];
        this.actualizarEventosCalendario();
    
        this.seleccionarDia({ dia, nombre: nombreDia });
    
        console.log('🔥 Click exacto en:', fechaFormateada);
    }
    



    actualizarEventosCalendario() {
        const eventosBase = this.resumenHoras.map((item) => ({
            title: `${item.total_horas} hrs`,
            date: item.fecha,
            backgroundColor: this.getResumenColor(item),
            borderColor: this.getResumenColor(item)
        }));

        const eventosMarcados = this.fechasMarcadas.map(fecha => ({
            title: '📌 Seleccionado',
            date: fecha,
            backgroundColor: '#ffcc00',
            borderColor: '#ffa500',
            display: 'background',
            id: 'marcado'
        }));

        const calendarApi = this.fullCalendarComponent?.getApi();
        calendarApi?.removeAllEvents();
        [...eventosBase, ...eventosMarcados].forEach(event => calendarApi?.addEvent(event));

    }




    getResumenColor(item: any): string {
        if (item.extrasMayorA0) return '#5bc0de'; // celeste
        if (item.esMayorOIgualA8) return '#5cb85c'; // verde
        if (item.total_horas > 0) return '#f0ad4e'; // naranjo
        return '#d9534f'; // rojo
    }

    toggleModo() {
        this.modoOscuro = !this.modoOscuro;

        const body = document.body;
        if (this.modoOscuro) {
            body.classList.add('dark-mode');
            body.classList.remove('light-mode');
        } else {
            body.classList.add('light-mode');
            body.classList.remove('dark-mode');
        }
    }



    seleccionarProyecto(proyecto: any) {
        // Asignar los valores a la variable proyectoSeleccionadoInfo
        this.proyectoSeleccionadoInfo.id_proyecto = proyecto.id_proyecto;
        this.proyectoSeleccionadoInfo.nombre_proyecto = proyecto.nombre_proyecto;

        // Convertir la fecha seleccionada al formato yyyy-mm-dd
        const [dia, mes, anio] = this.fechaSeleccionada.split('-');
        const fechaISO = `${anio}-${mes}-${dia}`;
        this.proyectoSeleccionadoInfo.fechaSeleccionada = fechaISO;

        // Imprimir la información del proyecto y la fecha seleccionada
        console.log('Proyecto seleccionado:');
        console.log('Proyecto:', proyecto);
        console.log(`ID: ${proyecto.id_proyecto}`);
        console.log(`Fecha seleccionada: ${fechaISO}`);
        console.log(`ID Usuario: ${this.id_usuario}`);

        // Validar que el ID del usuario esté definido
        if (!this.id_usuario) {
            console.error('Error: ID del usuario no está definido.');
            return;
        }

        // Obtener el comentario existente desde el backend
        this.horasExtraService.obtenerComentarios(proyecto.id_proyecto, fechaISO, this.id_usuario).subscribe(
            (comentarios) => {

                if (this.id_usuario != null) {

                    const mensajeExistente = comentarios.length > 0 ? comentarios[0].comentario : null;

                    // Abrir un popup para escribir o editar un mensaje
                    const mensaje = prompt(
                        mensajeExistente
                            ? `Edita el mensaje para el proyecto "${proyecto.nombre_proyecto}":`
                            : `Escribe un mensaje para el proyecto "${proyecto.nombre_proyecto}":`,
                        mensajeExistente || ''
                    );

                    if (mensaje) {
                        // Guardar o actualizar el comentario en el backend
                        this.horasExtraService.guardarComentario({
                            id_proyecto: proyecto.id_proyecto,
                            fecha: fechaISO,
                            comentario: mensaje,
                            id_usuario: this.id_usuario // Enviar el ID del usuario
                        }).subscribe(
                            (res) => {
                                console.log(`Mensaje guardado para el proyecto "${proyecto.nombre_proyecto}": ${mensaje}`);
                            },
                            (err) => {
                                console.error('Error al guardar el comentario:', err);
                            }
                        );
                    } else {
                        console.log('No se escribió ningún mensaje.');
                    }
                }
            },
            (err) => {
                console.error('Error al obtener los comentarios:', err);
            }
        );
    }

    async inicializarDatos() {

        await this.cargarHorasExtra();

        this.buscarResumenHorasUsuario(); // Llamar a la función para buscar el resumen de horas del usuario

        console.log('Fecha seleccionada:', this.fechaSeleccionada);

        if (this.fechaSeleccionada) {
            const [dia, mes, anio] = this.fechaSeleccionada.split('-').map(Number);
            const fecha = new Date(anio, mes - 1, dia);
            const nombreDia = this.diasSemanaAbreviados[fecha.getDay()];
            this.seleccionarDia({ dia, nombre: nombreDia });
        }
    }

    esFechaEnResumen(dia: number | null): boolean {
        if (!dia) {
            return false; // Si la celda está vacía, no hacer nada
        }

        // Determinar el año y el mes seleccionados
        const fechaActual = new Date();
        const anio = this.mesSeleccionado === this.mesAnterior ? fechaActual.getFullYear() - (fechaActual.getMonth() === 0 ? 1 : 0) : fechaActual.getFullYear();
        const mes = this.mesSeleccionado === this.mesAnterior ? (fechaActual.getMonth() === 0 ? 11 : fechaActual.getMonth() - 1) : fechaActual.getMonth();

        // Construir la fecha en formato yyyy-MM-dd
        const diaFormateado = dia.toString().padStart(2, '0'); // Asegurar que el día tenga dos dígitos
        const mesFormateado = (mes + 1).toString().padStart(2, '0'); // Asegurar que el mes tenga dos dígitos
        const fecha = `${anio}-${mesFormateado}-${diaFormateado}`;

        // Verificar si la fecha está en el resumenHoras
        return this.resumenHoras.some((item: any) => item.fecha === fecha);
    }

    esFechaAnterior(dia: number | null): boolean {
        if (!dia) {
            return false; // Si la celda está vacía, no hacer nada
        }

        // Determinar el año y el mes seleccionados
        const fechaActual = new Date();
        const anio = this.mesSeleccionado === this.mesAnterior ? fechaActual.getFullYear() - (fechaActual.getMonth() === 0 ? 1 : 0) : fechaActual.getFullYear();
        const mes = this.mesSeleccionado === this.mesAnterior ? (fechaActual.getMonth() === 0 ? 11 : fechaActual.getMonth() - 1) : fechaActual.getMonth();

        // Construir la fecha completa
        const fechaSeleccionada = new Date(anio, mes, dia);

        // Comparar con la fecha actual
        return fechaSeleccionada < new Date(); // Devuelve true si la fecha es anterior
    }

    getColorParaFecha(dia: number | null): string {
        if (!dia) {
            return ''; // Si la celda está vacía, no hacer nada
        }

        // Determinar el año y el mes seleccionados
        const fechaActual = new Date();
        const anio = this.mesSeleccionado === this.mesAnterior ? fechaActual.getFullYear() - (fechaActual.getMonth() === 0 ? 1 : 0) : fechaActual.getFullYear();
        const mes = this.mesSeleccionado === this.mesAnterior ? (fechaActual.getMonth() === 0 ? 11 : fechaActual.getMonth() - 1) : fechaActual.getMonth();

        // Construir la fecha en formato yyyy-MM-dd
        const diaFormateado = dia.toString().padStart(2, '0'); // Asegurar que el día tenga dos dígitos
        const mesFormateado = (mes + 1).toString().padStart(2, '0'); // Asegurar que el mes tenga dos dígitos
        const fecha = `${anio}-${mesFormateado}-${diaFormateado}`;

        // Buscar la fecha en el resumenHoras
        const resumen = this.resumenHoras.find((item: any) => item.fecha === fecha);

        // Obtener el día de la semana (0 = domingo, 6 = sábado)
        const diaSemana = new Date(anio, mes, dia).getDay();

        if (resumen) {
            if (resumen.extrasMayorA0) {
                return 'celeste'; // Si trabajó horas extra
            } else if (resumen.esMayorOIgualA8) {
                return 'verde'; // Si trabajó al menos 8 horas
            } else {
                return 'naranjo'; // Si trabajó menos de 8 horas
            }
        }

        // Si no hay resumen y la fecha es anterior a la actual 
        if (this.esFechaAnterior(dia)) {
            // Si es sábado o domingo, cambiar a blanco
            if (diaSemana === 0 || diaSemana === 6) {
                return 'blanco'; // Cambiar a blanco si debía ser rojo
            }
            return 'rojo'; // De lo contrario, rojo
        }

        return ''; // Si no aplica ninguna condición
    }


    seleccionarFecha(dia: number | null) {
        if (!dia) {
            return; // Si la celda está vacía, no hacer nada
        }

        const fechaActual = new Date();
        const anio = fechaActual.getFullYear();
        const mes = fechaActual.getMonth();

        // Construir el objeto del día seleccionado
        const diaSeleccionado = {
            dia: dia,
            nombre: this.diasSemanaAbreviados[new Date(anio, mes, dia).getDay()] // Obtener el nombre del día
        };

        // Llamar a seleccionarDia con el objeto construido
        this.seleccionarDia(diaSeleccionado);
    }

    async buscarResumenHorasUsuario(): Promise<void> {
        if (!this.id_usuario) {
            console.error('Error: No se encontró el ID del usuario.');
            return;
        }

        return new Promise<void>((resolve, reject) => {
            if (this.id_usuario != null) {
                this.horasExtraService.obtenerResumenPorUsuario(this.id_usuario).subscribe(
                    res => {
                        console.log('Resumen de horas obtenido:', res);

                        // Procesar los datos obtenidos
                        this.resumenHoras = res.data.map((item: any) => {
                            const totalHorasDecimal = parseFloat(item.total_horas);
                            const horasExtrasDecimal = parseFloat(item.horas_extras);

                            return {
                                fecha: new Date(item.fecha).toISOString().split('T')[0], // Convertir fecha a formato YYYY-MM-DD
                                total_horas: item.total_horas,
                                horas_extras: item.horas_extras,
                                esMayorA0: totalHorasDecimal > 0, // Saber si total_horas es mayor a 0
                                esMayorOIgualA8: totalHorasDecimal >= 8, // Saber si total_horas es igual o mayor a 8
                                extrasMayorA0: horasExtrasDecimal > 0 // Saber si horas_extras es mayor a 0
                            };
                        });

                        this.calendarOptions.events = this.resumenHoras.map((item) => ({
                            title: `${item.total_horas} hrs`,
                            date: item.fecha,
                            backgroundColor: this.getResumenColor(item),
                            borderColor: this.getResumenColor(item)
                        }));


                        console.log('Resumen procesado:', this.resumenHoras);
                        resolve(); // Resolver la promesa al finalizar

                    },
                    err => {
                        if (err.status === 404) {
                            console.warn('No se encontraron registros para el usuario. Continuando...');
                            this.resumenHoras = []; // Asegurarse de que el resumen esté vacío
                            resolve(); // Resolver la promesa incluso si no hay registros
                        } else {
                            console.error('Error al obtener el resumen de horas:', err);
                            reject(err); // Rechazar la promesa en caso de otros errores
                        }
                    }
                );
            }
        })
    }

    seleccionarMesActual() {
        this.mesSeleccionado = this.mesActual;
        console.log('Mes actual seleccionado:', this.mesActual);

        const fechaActual = new Date();
        const anio = fechaActual.getFullYear();
        const mes = fechaActual.getMonth();

        this.semanas = this.calcularSemanas(anio, mes);

        // 🔄 Actualizar vista del calendario
        this.fullCalendarComponent?.getApi().gotoDate(new Date(anio, mes, 1));

        this.semanaSeleccionada = null;
        this.diaSeleccionado = null;
        this.diasSeleccionados = [];
        this.fechaSeleccionada = '';

        // Generar las semanas y luego seleccionar la semana y día actual
        const diaActual = fechaActual.getDate();
        const semanaIndex = this.semanas.findIndex(sem => sem.includes(diaActual));
        if (semanaIndex !== -1) {
            this.mostrarDiasSemana(semanaIndex);
            const nombreDia = this.diasSemanaAbreviados[fechaActual.getDay()];
            this.seleccionarDia({ dia: diaActual, nombre: nombreDia });
        }
    }

    seleccionarMesAnterior() {
        this.mesSeleccionado = this.mesAnterior;
        console.log('Mes anterior seleccionado:', this.mesAnterior);

        const fechaActual = new Date();
        const anio = fechaActual.getFullYear();
        const mesAnteriorIndex = fechaActual.getMonth() - 1;

        const mes = mesAnteriorIndex >= 0 ? mesAnteriorIndex : 11;
        const anioAnterior = mesAnteriorIndex >= 0 ? anio : anio - 1;

        this.semanas = this.calcularSemanas(anioAnterior, mes);
        console.log('Semanas del mes anterior:', this.semanas);

        this.semanaSeleccionada = null;
        this.diaSeleccionado = null;
        this.diasSeleccionados = [];
        this.fechaSeleccionada = '';

        const ultimoDia = new Date(anioAnterior, mes + 1, 0).getDate();
        const nombreUltimoDia = this.diasSemanaAbreviados[
            new Date(anioAnterior, mes, ultimoDia).getDay()
        ];
        this.seleccionarDia({ dia: ultimoDia, nombre: nombreUltimoDia });

        // 🔄 Actualizar vista del calendario
        this.fullCalendarComponent?.getApi().gotoDate(new Date(anioAnterior, mes, 1));
    }



    mostrarDiasSemana(indiceSemana: number) {
        this.semanaSeleccionada = indiceSemana; // Marcar la semana seleccionada
        console.log(`Semana seleccionada: ${indiceSemana + 1}`);

        const fechaActual = new Date();
        const anio = fechaActual.getFullYear();
        const mes = this.mesSeleccionado === this.mesAnterior ? fechaActual.getMonth() - 1 : fechaActual.getMonth();

        const diasSemana = this.semanas[indiceSemana];
        this.diasSeleccionados = diasSemana.map((dia) => {
            const fecha = new Date(anio, mes, dia);
            const nombreDia = this.diasSemanaAbreviados[fecha.getDay()];
            return { dia, nombre: nombreDia };
        });

        console.log(`Días de la semana ${indiceSemana + 1}:`, this.diasSeleccionados);

        // Reiniciar la selección de día
        this.diaSeleccionado = null;
        this.fechaSeleccionada = '';
    }

    seleccionarDia(dia: { dia: number; nombre: string }) {
        this.fechasMarcadas = [];
        this.actualizarEventosCalendario();

        this.diaSeleccionado = dia.dia;
        console.log(`Día seleccionado: ${dia.nombre} ${dia.dia}`);

        // ✅ Usar el año y mes real si viene desde el calendario
        const fechaDesdeCalendario = this.fechasMarcadas.length > 0
            ? new Date(this.fechasMarcadas[0])
            : new Date();

        const anio = fechaDesdeCalendario.getFullYear();
        const mes = fechaDesdeCalendario.getMonth();

        const fechaFinal = new Date(anio, mes, dia.dia);

        // Formatear la fecha seleccionada en formato dd-mm-yyyy
        const diaFormateado = fechaFinal.getDate().toString().padStart(2, '0');
        const mesFormateado = (fechaFinal.getMonth() + 1).toString().padStart(2, '0');
        const anioFormateado = fechaFinal.getFullYear();

        this.fechaSeleccionada = `${diaFormateado}-${mesFormateado}-${anioFormateado}`;
        console.log(`Fecha seleccionada: ${this.fechaSeleccionada}`);

        this.fullCalendarComponent?.getApi().gotoDate(fechaFinal);

        // 💡 Actualizar evento visual en el calendario
        const calendario = this.fullCalendarComponent?.getApi();
        calendario.getEvents().forEach(event => {
            if (event.id === 'seleccionado') {
                event.remove();
            }
        });

        calendario.addEvent({
            id: 'seleccionado',
            title: '📌 Día seleccionado',
            start: fechaFinal,
            allDay: true,
            backgroundColor: '#ffcc00',
            borderColor: '#ffa500',
            display: 'background'
        });

        // Filtrar las horas correspondientes a la fecha seleccionada
        const fechaSeleccionadaISO = `${anioFormateado}-${mesFormateado}-${diaFormateado}`;
        const horasFiltradas = this.horasExtra.filter(hora => {
            const fechaHora = new Date(hora.fecha).toISOString().split('T')[0];
            return fechaHora === fechaSeleccionadaISO;
        });

        console.log('Horas correspondientes a la fecha seleccionada:', horasFiltradas);
        this.selectedCells = [];
        this.transformarHorasAlGrid(horasFiltradas);
    }


    transformarHorasAlGrid(horasFiltradas: any[]) {
        // Reiniciar la cuadrícula
        this.grid = Array.from({ length: this.proyectos.length }, () =>
            Array.from({ length: this.horarios.length * 2 }, () => ({ selected: false }))
        );

        // Recorrer las horas filtradas y marcar las celdas correspondientes
        horasFiltradas.forEach(hora => {
            const rowIndex = this.proyectos.findIndex(proyecto => proyecto.id_asignacion === hora.id_asignacion);
            if (rowIndex === -1) {
                console.warn(`No se encontró el proyecto con id_asignacion: ${hora.id_asignacion}`);
                return;
            }

            const horaInicioIndex = this.obtenerIndiceHorario(hora.hora_inicio);
            const horaFinIndex = this.obtenerIndiceHorario(hora.hora_fin);

            if (horaInicioIndex === -1 || horaFinIndex === -1) {
                console.warn(`No se pudo calcular el índice de horario para: ${hora.hora_inicio} - ${hora.hora_fin}`);
                return;
            }

            // Marcar las celdas en el rango de horaInicioIndex a horaFinIndex
            for (let colIndex = horaInicioIndex; colIndex < horaFinIndex; colIndex++) {
                this.grid[rowIndex][colIndex].selected = true;
                this.selectedCells.push({ row: rowIndex, col: colIndex });
            }
        });

        console.log('Grid actualizado con las horas filtradas:', this.grid);
        // Copiar la cuadrícula inicializada en copiaGrid
        this.copiaGrid = [...this.grid.map(row => [...row])];
    }

    obtenerIndiceHorario(horario: string): number {
        let [horas, minutos] = horario.split(':').map(Number);

        // Tratar las 00:00 como 24:00
        if (horas === 0 && minutos === 0) {
            horas = 24;
        }

        const baseHora = 8; // La hora inicial del grid es 08:00
        const totalMinutos = (horas - baseHora) * 60 + minutos;

        return Math.floor(totalMinutos / 30); // Cada columna representa 30 minutos
    }

    async eliminarHorasPorFecha(): Promise<void> {

        return new Promise<void>((resolve, reject) => {
            if (!this.id_usuario || !this.fechaSeleccionada) {
                console.error('Error: No se encontró el ID del usuario o la fecha seleccionada.');
                reject('ID de usuario o fecha no encontrados.'); // Rechazar la promesa si no se encuentran los datos necesarios
                return;
            }

            if (confirm(`¿Estás seguro de eliminar todas las horas registradas para el usuario en la fecha ${this.fechaSeleccionada}?`)) {
                const fechaISO = this.convertirFechaAFormatoISO(this.fechaSeleccionada); // Convertir la fecha al formato yyyy-mm-dd

                this.horasExtraService.eliminarHorasPorUsuarioYFecha(this.id_usuario, fechaISO).subscribe(
                    res => {
                        console.log('Horas eliminadas correctamente:', res);
                        this.cargarHorasExtra(); // Recargar las horas extra después de la eliminación
                        resolve(); // Resolver la promesa al finalizar
                    },
                    err => {
                        console.error('Error al eliminar las horas:', err);
                        reject(err); // Rechazar la promesa en caso de error
                    }
                );
            }
        });
    }

    calcularMeses() {
        const fechaActual = new Date();
        const meses = [
            'Enero',
            'Febrero',
            'Marzo',
            'Abril',
            'Mayo',
            'Junio',
            'Julio',
            'Agosto',
            'Septiembre',
            'Octubre',
            'Noviembre',
            'Diciembre',
        ];

        // Mes actual
        this.mesActual = meses[fechaActual.getMonth()];

        // Mes anterior
        const mesAnteriorIndex = fechaActual.getMonth() - 1;
        this.mesAnterior =
            mesAnteriorIndex >= 0
                ? meses[mesAnteriorIndex]
                : meses[11]; // Si es enero, el mes anterior es diciembre
    }

    calcularSemanas(anio: number, mes: number): number[][] {
        const primerDia = new Date(anio, mes, 1);
        const ultimoDia = new Date(anio, mes + 1, 0);

        const semanas: number[][] = [];
        let semana: number[] = Array(7).fill(null); // Crear una semana vacía con 7 días

        // Ajustar el índice del primer día (lunes = 0, domingo = 6)
        let diaSemana = primerDia.getDay() === 0 ? 6 : primerDia.getDay() - 1;

        for (let dia = primerDia.getDate(); dia <= ultimoDia.getDate(); dia++) {
            semana[diaSemana] = dia; // Asignar el día al índice correspondiente

            // Si es domingo (último día de la semana) o el último día del mes, guardar la semana y empezar una nueva
            if (diaSemana === 6 || dia === ultimoDia.getDate()) {
                semanas.push(semana);
                semana = Array(7).fill(null); // Reiniciar la semana
            }

            diaSemana = (diaSemana + 1) % 7; // Avanzar al siguiente día de la semana
        }

        return semanas;
    }

    cargarProyectos() {
        const token = this.authService.obtenerToken();
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            this.id_usuario = payload.id; // Obtener el ID del usuario logueado
        }

        if (this.id_usuario) {
            // Llamar al servicio para obtener los proyectos asignados al usuario logueado
            this.horasExtraService.obtenerProyectosAsignados(this.id_usuario).subscribe(
                res => {
                    // console.log('Proyectos asignados:', res);
                    this.proyectos = res.map(proyecto => ({
                        id_asignacion: proyecto.id_asignacion,
                        nombre: proyecto.proyecto_completo, // Mostrar nombre del proyecto y cliente
                        nombre_proyecto: proyecto.proyecto_nombre,
                        nombre_cliente: proyecto.cliente_nombre,
                        id_proyecto: proyecto.id_proyecto,
                    }));

                    // Extraer clientes únicos
                    this.clientes = [...new Map(this.proyectos.map(item => [item.nombre_cliente, item])).values()];
                    console.log('Clientes únicos:', this.clientes);

                    // Inicializar los proyectos filtrados
                    this.proyectosFiltrados = [...this.proyectos];

                    console.log('Proyectos asignados cargados:', this.proyectos);
                    this.initializeGrid();
                },
                err => {
                    console.error('Error al cargar proyectos asignados:', err);
                }
            );
        }
    }

    // Método para filtrar los proyectos por cliente
    filtrarProyectosPorCliente() {
        if (this.clienteSeleccionado) {
            this.proyectosFiltrados = this.proyectos.filter(
                proyecto => proyecto.nombre_cliente === this.clienteSeleccionado
            );
        } else {
            this.proyectosFiltrados = [...this.proyectos]; // Mostrar todos los proyectos si no hay cliente seleccionado
        }
        console.log('Proyectos :', this.proyectos);
        console.log('Proyectos filtrados:', this.proyectosFiltrados);

        console.log('Cantidad de proyectos:', this.proyectosFiltrados.length);

        console.log('Cuadrícula inicializada con proyectos filtrados:', this.grid);

        // Obtener los índices de los proyectos filtrados en la lista completa de proyectos
        this.indicesProyectosFiltrados = this.proyectosFiltrados.map(filtrado =>
            this.proyectos.findIndex(proyecto => proyecto.id_asignacion === filtrado.id_asignacion)
        );

        console.log('Índices de los proyectos filtrados en la lista completa de proyectos:', this.indicesProyectosFiltrados);

        // Crear una copia del grid con las filas seleccionadas
        this.copiaGrid = this.indicesProyectosFiltrados.map(index => this.grid[index]);

        console.log('Copia de grid con las filas seleccionadas:', this.copiaGrid);

        // Crear la cuadrícula con filas basadas en proyectosFiltrados y columnas basadas en horarios
        this.grid = Array.from({ length: this.proyectosFiltrados.length }, () =>
            Array.from({ length: this.horarios.length * 2 }, () => ({ selected: false }))
        );
    }

    initializeGrid() {
        console.log('Cantidad de proyectos:', this.proyectos.length);

        // Crear la cuadrícula con filas basadas en proyectos y columnas basadas en horarios
        this.grid = Array.from({ length: this.proyectos.length }, () =>
            Array.from({ length: this.horarios.length * 2 }, () => ({ selected: false }))
        );

        // Copiar la cuadrícula inicializada en copiaGrid
        this.copiaGrid = [...this.grid.map(row => [...row])];

        console.log('Grid inicializada:', this.grid);
        console.log('Copia de grid inicializada:', this.copiaGrid);
    }


    generarHorarios() {
        const horaInicio = new Date('2024-01-01T08:00:00'); // Hora inicial: 8:00
        const horaFin = new Date('2024-01-01T23:59:00'); // Hora final: 23:59

        while (horaInicio <= horaFin) {
            const horas = horaInicio.getHours().toString().padStart(2, '0');
            this.horarios.push(`${horas}:00`);
            horaInicio.setHours(horaInicio.getHours() + 1); // Incrementar 1 hora
        }
    }

    onMouseDown(event: MouseEvent, row: number, col: number) {
        this.isDragging = true; // Activar el modo de arrastre
        this.initialRow = row; // Guardar la fila inicial
        this.selectCell(row, col); // Seleccionar la celda inicial
        event.preventDefault(); // Evitar selección de texto
    }

    onMouseOver(row: number, col: number) {
        if (this.isDragging && this.initialRow !== null) {
            if (row === this.initialRow) {
                this.selectCell(row, col); // Seleccionar celdas en la misma fila
            }
        }
    }

    onMouseUp() {
        this.isDragging = false; // Desactivar el modo de arrastre
        this.initialRow = null; // Reiniciar la fila inicial
        console.log('Celdas seleccionadas:', this.selectedCells);
    }

    async guardar() {
        console.log('El botón Guardar fue presionado.');
        await this.eliminarHorasPorFecha(); // Llamar a la función para eliminar horas por fecha

        if (this.id_usuario === null) {
            console.error('Error: El ID del usuario no está definido.');
            return;
        }

        const { total, extras, totalDecimal, extrasDecimal } = this.calcularTotalHorasDelDia();

        const resumenDatos = {
            id_usuario: this.id_usuario,
            fecha: this.convertirFechaAFormatoISO(this.fechaSeleccionada),
            total_horas: totalDecimal,
            horas_extras: extrasDecimal
        };

        let idResumenHoras: number | null = null;

        // Verificar si ya existe un registro con el mismo id_usuario y fecha
        await new Promise<void>((resolve, reject) => {
            this.horasExtraService.buscarResumenHoras(this.id_usuario!, resumenDatos.fecha).subscribe(
                res => {
                    console.log('Registro encontrado, actualizando...', res);

                    this.horasExtraService.actualizarResumenHoras(resumenDatos).subscribe(
                        res => {
                            console.log('Resumen de horas actualizado con éxito:', res);
                            idResumenHoras = (res as { id_resumen: number }).id_resumen; // Asignar el ID del resumen actualizado
                            resolve();
                        },
                        err => {
                            console.error('Error al actualizar el resumen de horas:', err);
                            reject(err);
                        }
                    );
                },
                err => {
                    if (err.status === 404) {
                        console.log('No se encontró un registro, creando uno nuevo...');

                        this.horasExtraService.guardarResumenHoras(resumenDatos).subscribe(
                            res => {
                                console.log('Resumen de horas guardado con éxito:', res);
                                idResumenHoras = (res as { id_resumen: number }).id_resumen; // Asignar el ID del resumen creado
                                resolve();
                            },
                            err => {
                                console.error('Error al guardar el resumen de horas:', err);
                                reject(err);
                            }
                        );
                    } else {
                        console.error('Error al buscar el resumen de horas:', err);
                        reject(err);
                    }
                }
            );
        });

        if (!idResumenHoras) {
            console.error('Error: No se pudo obtener el ID del resumen de horas.');
            return;
        }

        console.log('ID del resumen de horas obtenido:', idResumenHoras);

        // Resto de la lógica para guardar las horas extra...
        const agrupadoPorFila: { [key: number]: number[] } = {};

        this.selectedCells.forEach((celda) => {
            if (!agrupadoPorFila[celda.row]) {
                agrupadoPorFila[celda.row] = [];
            }
            agrupadoPorFila[celda.row].push(celda.col);
        });

        // Ordenar las columnas dentro de cada fila
        for (const fila in agrupadoPorFila) {
            agrupadoPorFila[fila].sort((a, b) => a - b);
        }

        console.log('Enviando datos a la base de datos:');
        for (const fila in agrupadoPorFila) {
            const idUsuario = this.id_usuario || 'Usuario desconocido';
            const idAsignacion = this.proyectos[parseInt(fila, 10)]?.id_asignacion || 'Asignación desconocida';
            const fecha = this.convertirFechaAFormatoISO(this.fechaSeleccionada); // Convertir la fecha al formato yyyy-mm-dd
            const columnas = agrupadoPorFila[fila];

            if (columnas.length > 0) {
                let inicio = columnas[0];
                let fin = columnas[0];

                for (let i = 1; i < columnas.length; i++) {
                    if (columnas[i] === fin + 1) {
                        // Continuar el rango
                        fin = columnas[i];
                    } else {
                        // Finalizar el rango actual y enviar los datos
                        const horaInicio = this.calcularHorario(inicio);
                        const horaFin = this.calcularHorario(fin + 1); // +1 para incluir el último intervalo
                        const totalHoras = this.calcularHoras(horaInicio, horaFin);

                        const datos = {
                            id_usuario: idUsuario,
                            id_asignacion: idAsignacion,
                            id_resumen_horas: idResumenHoras, // Asociar el ID del resumen de horas
                            fecha: fecha, // Fecha en formato yyyy-mm-dd
                            hora_inicio: horaInicio,
                            hora_fin: horaFin,
                            total_horas: totalHoras,
                        };
                        console.log('Datos enviados al backend:', datos);

                        this.horasExtraService.registrarHorasExtra(datos).subscribe(
                            res => {
                                console.log('Registro exitoso:', datos);
                            },
                            err => {
                                console.error('Error al registrar horas extra:', err);
                            }
                        );

                        // Iniciar un nuevo rango
                        inicio = columnas[i];
                        fin = columnas[i];
                    }
                }

                // Agregar el último rango y enviarlo
                const horaInicio = this.calcularHorario(inicio);
                const horaFin = this.calcularHorario(fin + 1); // +1 para incluir el último intervalo
                const totalHoras = this.calcularHoras(horaInicio, horaFin);

                const datos = {
                    id_usuario: idUsuario,
                    id_asignacion: idAsignacion.toString(),
                    id_resumen_horas: idResumenHoras, // Asociar el ID del resumen de horas
                    fecha: fecha, // Fecha en formato yyyy-mm-dd
                    hora_inicio: horaInicio,
                    hora_fin: horaFin,
                    total_horas: totalHoras,
                };

                this.horasExtraService.registrarHorasExtra(datos).subscribe(
                    res => {
                        console.log('Registro exitoso:', datos);
                    },
                    err => {
                        console.error('Error al registrar horas extra:', err);
                    }
                );
            }
        }
    }

    // Función para convertir la fecha al formato yyyy-mm-dd
    convertirFechaAFormatoISO(fecha: string): string {
        const [dia, mes, anio] = fecha.split('-');
        return `${anio}-${mes}-${dia}`;
    }

    generarHorasAgrupadas() {
        const baseHora = new Date('2024-01-01T08:00:00');
        for (let i = 0; i < 16; i++) {
            const hora = baseHora.getHours().toString().padStart(2, '0') + ':00';
            this.horasAgrupadas.push(hora);
            baseHora.setHours(baseHora.getHours() + 1);
        }
    }

    // Función para calcular el horario basado en el índice de la columna
    calcularHorario(colIndex: number): string {
        const horaInicio = new Date('2024-01-01T08:00:00'); // Hora inicial: 8:00 AM
        horaInicio.setMinutes(horaInicio.getMinutes() + colIndex * 30); // Incrementar 30 minutos por cada columna
        const horas = horaInicio.getHours().toString().padStart(2, '0');
        const minutos = horaInicio.getMinutes().toString().padStart(2, '0');
        return `${horas}:${minutos}`;
    }

    // Modificar la función calcularHoras para aceptar horaInicio y horaFin como parámetros
    calcularHoras(horaInicio: string, horaFin: string): string {
        let [horaInicioHoras, horaInicioMinutos] = horaInicio.split(':').map(Number);
        let [horaFinHoras, horaFinMinutos] = horaFin.split(':').map(Number);

        // Tratar las 00:00 como 24:00
        if (horaFinHoras === 0 && horaFinMinutos === 0) {
            horaFinHoras = 24;
        }

        const inicio = new Date(2024, 0, 1, horaInicioHoras, horaInicioMinutos); // Fecha ficticia para cálculos
        const fin = new Date(2024, 0, 1, horaFinHoras, horaFinMinutos);

        const totalMinutos = (fin.getTime() - inicio.getTime()) / (1000 * 60);
        if (totalMinutos < 0) {
            console.error('Error: La hora de fin es anterior a la hora de inicio.');
            return '00:00';
        }

        const horas = Math.floor(totalMinutos / 60);
        const minutos = Math.floor(totalMinutos % 60);

        return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
    }

    onCellClick(row: number, col: number) {
        this.selectCell(row, col);
    }

    selectCell(row: number, col: number) {
        if (this.grid[row] && this.grid[row][col]) { // Verificar que la celda exista

            // Si la celda ya está seleccionada, deseleccionarla
            if (this.grid[row][col].selected) {
                this.grid[row][col].selected = false;
                this.selectedCells = this.selectedCells.filter(
                    cell => !(cell.row === row && cell.col === col) // Eliminar la celda de selectedCells
                );
                console.log(`Celda deseleccionada: (${row}, ${col})`);
            } else {
                // Deseleccionar cualquier celda previamente seleccionada en la misma columna
                this.selectedCells = this.selectedCells.filter(cell => {
                    if (cell.col === col) {
                        this.grid[cell.row][cell.col].selected = false; // Deseleccionar la celda en la grid
                        return false; // Eliminar la celda de selectedCells
                    }
                    return true; // Mantener las demás celdas
                });

                // Seleccionar la nueva celda
                this.grid[row][col].selected = true;
                this.selectedCells.push({ row, col });
                console.log(`Celda seleccionada: (${row}, ${col})`);
            }

            // Recalcular el total de horas del día
            console.log('Recalculando total de horas del día...');
            console.log('Horas del día:', this.calcularTotalHorasDelDia());
        }
    }

    onFechaDesdeChange() {
        console.log('Fecha Desde seleccionada:', this.fechaDesde);
        this.verificarFechasSeleccionadas();
    }

    onFechaHastaChange() {
        console.log('Fecha Hasta seleccionada:', this.fechaHasta);
        this.verificarFechasSeleccionadas();
    }
    verificarFechasSeleccionadas() {
        if (this.fechaDesde && this.fechaHasta) {
            console.log('Ambas fechas están seleccionadas:');
            console.log('Desde:', this.fechaDesde, 'Hasta:', this.fechaHasta);

            // Filtrar las horas extra dentro del rango de fechas
            this.horasExtraFiltradas = this.horasExtra.filter(hora => {
                const fechaHora = new Date(hora.fecha);
                const desde = new Date(this.fechaDesde);
                const hasta = new Date(this.fechaHasta);
                return fechaHora >= desde && fechaHora <= hasta;
            });

            // Imprimir las horas extra filtradas
            console.log('Horas extra dentro del rango:', this.horasExtraFiltradas);
        } else {
            // Si no están ambas fechas seleccionadas, mostrar la lista completa
            this.horasExtraFiltradas = [...this.horasExtra];
            console.log('No se seleccionaron ambas fechas. Mostrando la lista completa:', this.horasExtraFiltradas);
        }
    }

    registrarHoras() {
        if (!this.id_usuario || !this.id_proyecto) { // Validar que id_proyecto no sea null
            this.mensaje = 'Error: Usuario o Proyecto no identificado.';
            return;
        }

        const datos = {
            id_usuario: this.id_usuario,
            id_asignacion: this.id_proyecto, // Cambiar id_proyecto por id_asignacion
            fecha: this.fecha,
            hora_inicio: this.horaInicio,
            hora_fin: this.horaFin,
            total_horas: this.calcularHoras(this.horaInicio, this.horaFin),
            descripcion: this.descripcion
        };

        console.log('Datos a registrar:', datos);

        this.horasExtraService.registrarHorasExtra(datos).subscribe(
            res => {
                this.mensaje = 'Horas extra registradas correctamente.';
                this.limpiarFormulario();
                this.cargarHorasExtra();
            },
            err => {
                this.mensaje = 'Error al registrar las horas.';
                console.error('Error en Angular:', err);
            }
        );
    }

    limpiarFormulario() {
        this.fecha = '';
        this.horaInicio = '';
        this.horaFin = '';
        this.descripcion = '';
    }

    async cargarHorasExtra(): Promise<void> {

        return new Promise<void>((resolve, reject) => {
            if (!this.id_usuario) {
                console.error('Error: No se encontró el ID del usuario logueado.');
                return;
            }
            // Verificar si el usuario es Administrador
            const token = this.authService.obtenerToken();
            let esAdministrador = false;

            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                esAdministrador = payload.rol === 'Administrador'; // Verificar el rol del usuario
            }

            if (esAdministrador) {
                // Cargar todas las horas extra si el usuario es Administrador
                this.horasExtraService.obtenerHorasExtra().subscribe(
                    res => {
                        this.horasExtra = res.map(hora => ({
                            ...hora,
                            usuario_completo: `${hora.usuario_nombre ?? ''} ${hora.usuario_apellido ?? ''}`.trim(),
                            proyecto_completo: `${hora.proyecto_nombre ?? ''} - ${hora.cliente_nombre ?? ''}`.trim()
                        }));
                        console.log('Todas las horas extra cargadas (Administrador):', this.horasExtra);
                        this.horasExtraFiltradas = [...this.horasExtra];
                        resolve(); // Resolver la promesa al finalizar
                    },
                    err => {
                        console.error('Error al cargar todas las horas extra:', err);
                        reject(err); // Rechazar la promesa en caso de error
                    }
                );
            } else {
                // Cargar solo las horas extra del usuario logueado
                this.horasExtraService.obtenerHorasExtraPorUsuario(this.id_usuario).subscribe(
                    res => {
                        this.horasExtra = res.map(hora => ({
                            ...hora,
                            usuario_completo: `${hora.usuario_nombre ?? ''} ${hora.usuario_apellido ?? ''}`.trim(),
                            proyecto_completo: `${hora.proyecto_nombre ?? ''} - ${hora.cliente_nombre ?? ''}`.trim()
                        }));
                        console.log('Horas extra cargadas para el usuario logueado:', this.horasExtra);
                        this.horasExtraFiltradas = [...this.horasExtra];
                        resolve(); // Resolver la promesa al finalizar
                    },
                    err => {
                        console.error('Error al cargar horas extra para el usuario logueado:', err);
                        reject(err); // Rechazar la promesa en caso de error
                    }
                );
            }
        });
    }

    calcularTotalHorasDelDia(): { total: string; extras: string; totalDecimal: number; extrasDecimal: number } {
        if (!this.selectedCells || this.selectedCells.length === 0) {
            return { total: '00:00', extras: '00:00', totalDecimal: 0, extrasDecimal: 0 }; // Si no hay celdas seleccionadas, retornar 0
        }

        // Cada celda representa 30 minutos
        const totalMinutos = this.selectedCells.length * 30;

        // Limitar el total de minutos a un máximo de 8 horas (480 minutos)
        const minutosLimitados = Math.min(totalMinutos, 8 * 60);

        // Convertir minutos limitados a horas y minutos
        const horas = Math.floor(minutosLimitados / 60);
        const minutos = minutosLimitados % 60;

        // Calcular horas extra (si exceden las 8 horas)
        const horasExtraMinutos = Math.max(totalMinutos - 8 * 60, 0); // Minutos que exceden las 8 horas
        const horasExtra = Math.floor(horasExtraMinutos / 60);
        const minutosExtra = horasExtraMinutos % 60;

        // Convertir a formato decimal
        const totalDecimal = horas + minutos / 60;
        const extrasDecimal = horasExtra + minutosExtra / 60;

        return {
            total: `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`,
            extras: `${horasExtra.toString().padStart(2, '0')}:${minutosExtra.toString().padStart(2, '0')}`,
            totalDecimal: parseFloat(totalDecimal.toFixed(2)),
            extrasDecimal: parseFloat(extrasDecimal.toFixed(2))
        };
    }

    editarHoraExtra(hora: any) {
        this.horaSeleccionada = { ...hora }; // Clonar objeto para edición
        this.recalcularHoras();
    }

    // Recalcular total_horas cuando cambien hora_inicio o hora_fin
    recalcularHoras() {
        if (!this.horaSeleccionada?.hora_inicio || !this.horaSeleccionada?.hora_fin) return;

        let [horaInicioHoras, horaInicioMinutos] = this.horaSeleccionada.hora_inicio.split(':').map(Number);
        let [horaFinHoras, horaFinMinutos] = this.horaSeleccionada.hora_fin.split(':').map(Number);

        // Tratar las 00:00 como 24:00
        if (horaFinHoras === 0 && horaFinMinutos === 0) {
            horaFinHoras = 24;
        }

        const inicio = new Date(2024, 0, 1, horaInicioHoras, horaInicioMinutos); // Fecha ficticia para cálculos
        const fin = new Date(2024, 0, 1, horaFinHoras, horaFinMinutos);

        const totalMinutos = (fin.getTime() - inicio.getTime()) / (1000 * 60);
        if (totalMinutos < 0) {
            console.error('Error: La hora de fin es anterior a la hora de inicio.');
            this.horaSeleccionada!.total_horas = '00:00';
            return;
        }

        const horas = Math.floor(totalMinutos / 60);
        const minutos = Math.floor(totalMinutos % 60);

        this.horaSeleccionada!.total_horas = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
    }

    cancelarEdicion() {
        this.horaSeleccionada = null;
    }

    guardarEdicion() {
        if (!this.horaSeleccionada) {
            console.error('No hay hora seleccionada para editar.');
            return;
        }

        // Asignar el id del usuario logueado como id_aprobador si el estado es "aprobado" o "rechazado"
        if (this.horaSeleccionada.estado === 'aprobado' || this.horaSeleccionada.estado === 'rechazado') {
            this.horaSeleccionada.id_aprobador = this.id_usuario; // Asignar el usuario logueado
        }

        console.log('Datos enviados para actualizar:', this.horaSeleccionada);

        this.horasExtraService.editarHorasExtra(this.horaSeleccionada).subscribe(
            res => {
                this.cargarHorasExtra();
                this.horaSeleccionada = null;
                console.log('Hora extra actualizada correctamente.');
            },
            err => {
                console.error('Error al actualizar horas extra:', err);
            }
        );
    }

    eliminarHoraExtra(id: number) {
        if (confirm('¿Estás seguro de eliminar esta hora extra?')) {
            this.horasExtraService.eliminarHorasExtra(id).subscribe(
                res => {
                    this.cargarHorasExtra();
                },
                err => {
                    console.error('Error al eliminar horas extra:', err);
                }
            );
        }
    }

    exportarExcel() {
        if (this.horasExtra.length === 0) {
            console.warn('No hay datos para exportar.');
            return;
        }

        this.document = this.horasExtra[0]?.usuario_completo ?? 'Reporte';

        const data = this.horasExtra.map(hora => ({
            Fecha: new Date(hora.fecha).toISOString().split('T')[0], // Formato YYYY-MM-DD
            'Hora Inicio': hora.hora_inicio,
            'Hora Fin': hora.hora_fin,
            'Total Horas': hora.total_horas,
            Usuario: hora.usuario_completo,      // Nombre + Apellido
            Proyecto: hora.proyecto_completo,    // Proyecto + Cliente
            Descripción: hora.descripcion,
            Estado: hora.estado
        }));

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Horas Extra');

        const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, `horas_extra ${this.document}.xlsx`);
    }

    exportarPDF() {
        const doc = new jsPDF();
        doc.text('Reporte de Horas Extra', 10, 10);

        autoTable(doc, {
            head: [['Fecha', 'Hora Inicio', 'Hora Fin', 'Total Horas', 'Usuario', 'Proyecto', 'Descripción', 'Estado']],
            body: this.horasExtra.map(hora => [
                this.document = hora.usuario_completo,
                new Date(hora.fecha).toISOString().split('T')[0],
                hora.hora_inicio,
                hora.hora_fin,
                hora.total_horas,
                hora.usuario_completo,      // Nombre + Apellido
                hora.proyecto_completo,     // Proyecto + Cliente
                hora.descripcion,
                hora.estado
            ]),
            startY: 20
        });


        doc.save(`horas_extra ${this.document}.pdf`);
    }
}
