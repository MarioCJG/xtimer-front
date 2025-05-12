import { Component } from '@angular/core';
import { HorasExtraService } from '../../services/horas-extra.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';



@Component({
  selector: 'app-resumen',
  imports: [CommonModule, FormsModule],
  templateUrl: './resumen.component.html',
  styleUrl: './resumen.component.css',

})
export class ResumenComponent {

  horasExtra: any[] = [];
  resumenHoras: any[] = [];
  horasFiltradas: any[] = [];

  opcionesCargo: string[] = []; // Opciones únicas para el filtro de cargo
  opcionesArea: string[] = []; // Opciones únicas para el filtro de área
  opcionesConsultor: string[] = []; // Opciones únicas para el filtro de consultores
  opcionesCliente: string[] = []; // Opciones únicas para el filtro de área
  opcionesProyecto: string[] = []; // Opciones únicas para el filtro de consultores

  filtroCargo: string = ''; // Filtro para el cargo
  filtroArea: string = ''; // Filtro para el área
  filtroCliente: string = ''; // Filtro para el área
  filtroProyecto: string = ''; // Filtro para el área
  filtroConsultor: string = ''; // Filtro para el nombre del consultor
  filtroFechaDesde: string = ''; // Filtro para la fecha desde
  filtroFechaHasta: string = ''; // Filtro para la fecha hasta

  // Inicializar contadores y acumuladores
  totalHorasMenorA8: number = 0;
  horasExtraMayorA0: number = 0;
  sumaTotalHorasExtra: number = 0;
  aprobacionesPendientes: number = 0;
  parteEntera: number = 0;
  parteDecimal: string = "00";

  resumenHorasExtra: any[] = []; // Nueva variable para almacenar los datos de la API
  totalHorasNormales: number = 0; // Total de horas normales
  totalHorasExtras: number = 0; // Total de horas extras
  resumenHorasExtraFiltradas: any[] = []; // Datos filtrados para la tabla
  parteEnteraHorasNormales: number = 0;
  parteDecimalHorasNormales: string = "00";
  parteEnteraHorasExtra: number = 0;
  parteDecimalHorasExtra: string = "00";

  // Variables para los filtros
  filtroFechaDesdeExtra: string = '';
  filtroFechaHastaExtra: string = '';
  filtroProyectoResumen: string = '';
  filtroClienteResumen: string = '';
  filtroConsultores: string = '';

  // Opciones para las listas desplegables
  opcionesProyectos: string[] = [];
  opcionesClientes: string[] = [];
  opcionesConsultores: string[] = [];

  resumenSeleccionado: string = 'tablaSuperior'; // Valor inicial

  mostrarResumen(resumen: string): void {
    this.resumenSeleccionado = resumen;
  }


  constructor(private horasExtraService: HorasExtraService) { }

  ngOnInit() {
    this.cargarResumenHoras(); // Cargar el resumen de horas al
    this.cargarResumenHorasExtra();
  }


  cargarResumenHoras() {
    this.horasExtraService.obtenerResumenHoras().subscribe(
      res => {
        console.log('>Datos recibidos del backend:', res);

        // Formatear los campos numéricos y las fechas
        this.resumenHoras = res.map(hora => ({
          ...hora,
          horas_extras: parseFloat(hora.horas_extras).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
          total_horas: parseFloat(hora.total_horas).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
        }));

        this.horasFiltradas = [...this.resumenHoras]; // Inicializar las horas filtradas con todos los datos

        // Generar opciones únicas para los filtros
        this.opcionesCargo = [...new Set(this.resumenHoras.map(hora => hora.cargo_nombre))];
        this.opcionesArea = [...new Set(this.resumenHoras.map(hora => hora.area_nombre))];
        this.opcionesConsultor = [...new Set(this.resumenHoras.map(hora => hora.consultor_nombre))];
        this.opcionesCliente = [...new Set(this.resumenHoras.map(hora => hora.cliente_nombre))];
        this.opcionesProyecto = [...new Set(this.resumenHoras.map(hora => hora.proyecto_nombre))];

        console.log('Opciones de cargo:', this.opcionesCargo);
        console.log('Opciones de área:', this.opcionesArea);
        console.log('Opciones de consultores:', this.opcionesConsultor);

        this.resumirHorasFiltradas();
      },
      err => {
        console.error('❌ Error al cargar resumen de horas:', err);
      }
    );
  }

  resumirHorasFiltradas() {
    // Reiniciar contadores y acumuladores
    this.totalHorasMenorA8 = 0;
    this.horasExtraMayorA0 = 0;
    this.sumaTotalHorasExtra = 0;
    this.aprobacionesPendientes = 0;

    // Recorrer las horas filtradas
    this.horasFiltradas.forEach(hora => {
      // Contar cuántas `total_horas` son igual a 8 y `horas_extras` son 0
      if (parseFloat(hora.total_horas) < 8) {
        this.totalHorasMenorA8++;
      }

      if (hora.aprobacion === 'pendiente') {
        this.aprobacionesPendientes++;
      }

      // Contar cuántas `horas_extras` son mayores a 0
      if (parseFloat(hora.horas_extras) > 0) {
        this.horasExtraMayorA0++;
      }

      const horasExtras = parseFloat(hora.horas_extras);
      this.sumaTotalHorasExtra += horasExtras;

    });

    this.parteEntera = Math.floor(this.sumaTotalHorasExtra);
    const parteDecimal = this.sumaTotalHorasExtra - this.parteEntera;

    if (parteDecimal > 0) {
      this.parteDecimal = "30";
    } else {
      this.parteDecimal = "00";
      console.log(`El número ${this.sumaTotalHorasExtra} no tiene una parte decimal.`);
    }

    // Mostrar el resumen en la consola
    console.log('Resumen de horas filtradas:');
    console.log(`Total de registros con total_horas igual a 8: ${this.totalHorasMenorA8}`);
    console.log(`Total de registros con horas_extras mayor a 0: ${this.horasExtraMayorA0}`);
    console.log(`Suma total de horas_extras: ${this.sumaTotalHorasExtra}`);
    console.log(`Total de aprobaciones pendientes: ${this.aprobacionesPendientes}`);
  }

  cargarResumenHorasExtra(): void {
    this.horasExtraService.obtenerResumenHorasExtra().subscribe(
      (data) => {
        console.log('Datos recibidos del backend:', data);

        // Formatear los campos numéricos
        this.resumenHorasExtra = data.map(item => ({
          ...item,
          horas_extras: parseFloat(item.horas_extras).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
          horas_normales: parseFloat(item.horas_normales).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
          total_horas: parseFloat(item.total_horas).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
        }));

        this.resumenHorasExtraFiltradas = [...this.resumenHorasExtra]; // Inicialmente, los datos filtrados son los mismos que los originales
        this.calcularTotales();
        this.generarOpcionesFiltros(); // Generar las opciones para los filtros
      },
      (error) => {
        console.error('Error al obtener los datos desde la API:', error);
      }
    );
  }

  generarOpcionesFiltros(): void {
    this.opcionesProyectos = [...new Set(this.resumenHorasExtra.map(item => item.proyecto_nombre))];
    this.opcionesClientes = [...new Set(this.resumenHorasExtra.map(item => item.cliente_nombre))];
    this.opcionesConsultores = [...new Set(this.resumenHorasExtra.flatMap(item => item.consultores.split(', ')))];
  }

  aplicarFiltrosExtra(): void {
    this.resumenHorasExtraFiltradas = this.resumenHorasExtra.filter((resumen) => {
      const fecha = new Date(resumen.fecha);
      const fechaDesde = this.filtroFechaDesdeExtra ? new Date(this.filtroFechaDesdeExtra + 'T00:00:00') : null;
      const fechaHasta = this.filtroFechaHastaExtra ? new Date(this.filtroFechaHastaExtra + 'T23:59:59') : null;


      const cumpleFechaDesde = fechaDesde ? fecha >= fechaDesde : true;
      const cumpleFechaHasta = fechaHasta ? fecha <= fechaHasta : true;
      const cumpleProyecto = this.filtroProyecto ? resumen.proyecto_nombre === this.filtroProyecto : true;
      const cumpleCliente = this.filtroCliente ? resumen.cliente_nombre === this.filtroCliente : true;
      const cumpleConsultores = this.filtroConsultores
        ? resumen.consultores.split(', ').includes(this.filtroConsultores)
        : true;


      return cumpleFechaDesde && cumpleFechaHasta && cumpleProyecto && cumpleCliente && cumpleConsultores;
    });
    this.calcularTotales(); // Calcular totales después de aplicar los filtros
  }

  calcularTotales(): void {
    this.totalHorasNormales = this.resumenHorasExtraFiltradas.reduce((sum, item) => sum + parseFloat(item.horas_normales), 0);
    this.totalHorasExtras = this.resumenHorasExtraFiltradas.reduce((sum, item) => sum + parseFloat(item.horas_extras), 0);

    this.parteEnteraHorasNormales = Math.floor(this.totalHorasNormales);
    const parteDecimal = this.totalHorasNormales - this.parteEnteraHorasNormales;

    this.parteEnteraHorasExtra = Math.floor(this.totalHorasExtras);
    const parteDecimalExtra = this.totalHorasExtras - this.parteEnteraHorasExtra;

    if (parteDecimal > 0) {
      this.parteDecimalHorasNormales = "30";
    } else {
      this.parteDecimalHorasNormales = "00";
      console.log(`El número ${this.totalHorasNormales} no tiene una parte decimal.`);
    }

    if (parteDecimalExtra > 0) {
      this.parteDecimalHorasExtra = "30";
    }
    else {
      this.parteDecimalHorasExtra = "00";
      console.log(`El número ${this.totalHorasExtras} no tiene una parte decimal.`);
    }
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

    // Filtro por Fecha Desde
    if (this.filtroFechaDesde) {
      const fechaDesde = new Date(this.filtroFechaDesde + 'T00:00:00'); // Ajustar al inicio del día
      console.log('Fecha desde ajustada:', fechaDesde);
      filtradas = filtradas.filter(hora => new Date(hora.fecha) >= fechaDesde);
    }

    // Filtro por Fecha Hasta
    if (this.filtroFechaHasta) {
      const fechaHasta = new Date(this.filtroFechaHasta + 'T23:59:59'); // Ajustar al final del día
      console.log('Fecha hasta ajustada:', fechaHasta);
      filtradas = filtradas.filter(hora => new Date(hora.fecha) <= fechaHasta);
    }

    // Actualizar la variable horasFiltradas
    this.horasFiltradas = filtradas;
    console.log('Horas filtradas:', this.horasFiltradas);
    this.resumirHorasFiltradas();

  }
}
