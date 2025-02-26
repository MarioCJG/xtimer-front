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

@Component({
    selector: 'app-horas-extra',
    standalone: true,
    templateUrl: './horas-extra.component.html',
    styleUrls: ['./horas-extra.component.css'],
    imports: [FormsModule, CommonModule, FilterFechaPipe, FilterEstadoPipe]
})
export class HorasExtraComponent {
    fecha: string = '';
    horaInicio: string = '';
    horaFin: string = '';
    descripcion: string = '';
    id_usuario: number | null = null;
    id_proyecto: number | null = null; // 🔹 Agregar campo id_proyecto
    mensaje: string = '';
    proyectos: any[] = [];
    horasExtra: any[] = [];
    filtroFecha: string = '';
    filtroEstado: string = '';
    usuarioLogueado: number | null = null;
    horaSeleccionada: HorasExtra | null = null;
    document: string = '';

    constructor(private horasExtraService: HorasExtraService, private authService: AuthService) { }

    ngOnInit() {
        const token = this.authService.obtenerToken();
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            this.id_usuario = payload.id;
        }

        this.horasExtraService.obtenerProyectos().subscribe(
            res => { this.proyectos = res; },
            err => { console.error('Error al cargar proyectos:', err); }
        );
        this.cargarHorasExtra();
    }

    registrarHoras() {
        if (!this.id_usuario || !this.id_proyecto) { // 🔹 Validar que id_proyecto no sea null
            this.mensaje = 'Error: Usuario o Proyecto no identificado.';
            return;
        }

        const datos = {
            id_usuario: this.id_usuario,
            id_proyecto: this.id_proyecto, // 🔹 Enviar id_proyecto
            fecha: this.fecha,
            hora_inicio: this.horaInicio,
            hora_fin: this.horaFin,
            total_horas: this.calcularHoras(),
            descripcion: this.descripcion
        };

        this.horasExtraService.registrarHorasExtra(datos).subscribe(
            res => {
                this.mensaje = 'Horas extra registradas correctamente.';
                this.limpiarFormulario();
                this.cargarHorasExtra();
            },
            err => {
                this.mensaje = 'Error al registrar las horas.';
                console.error('❌ Error en Angular:', err);
            }
        );
    }

    calcularHoras(): string {
        const inicio = new Date(`2024-01-01T${this.horaInicio}`);
        const fin = new Date(`2024-01-01T${this.horaFin}`);

        const totalMinutos = (fin.getTime() - inicio.getTime()) / (1000 * 60);
        const horas = Math.floor(totalMinutos / 60);
        const minutos = Math.floor(totalMinutos % 60);

        return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
    }

    limpiarFormulario() {
        this.fecha = '';
        this.horaInicio = '';
        this.horaFin = '';
        this.descripcion = '';
    }

    cargarHorasExtra() {
        this.horasExtraService.obtenerHorasExtra().subscribe(
            res => {
                this.horasExtra = res.map(hora => ({
                    ...hora,
                    usuario_completo: `${hora.usuario_nombre ?? ''} ${hora.usuario_apellido ?? ''}`.trim(),
                    proyecto_completo: `${hora.proyecto_nombre ?? ''} - ${hora.cliente_nombre ?? ''}`.trim()
                }));
            },
            err => { console.error('Error al cargar horas extra:', err); }
        );
    }


    editarHoraExtra(hora: any) {
        this.horaSeleccionada = { ...hora }; // Clonar objeto para edición
        this.recalcularHoras();
    }

    // Recalcular total_horas cuando cambien hora_inicio o hora_fin
    recalcularHoras() {
        if (!this.horaSeleccionada?.hora_inicio || !this.horaSeleccionada?.hora_fin) return;

        const inicio = new Date(`2024-01-01T${this.horaSeleccionada.hora_inicio}`);
        const fin = new Date(`2024-01-01T${this.horaSeleccionada.hora_fin}`);

        const totalMinutos = (fin.getTime() - inicio.getTime()) / (1000 * 60);
        const horas = Math.floor(totalMinutos / 60);
        const minutos = Math.floor(totalMinutos % 60);

        this.horaSeleccionada!.total_horas = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
    }

    cancelarEdicion() {
        this.horaSeleccionada = null;
    }

    guardarEdicion() {
        this.horasExtraService.editarHorasExtra(this.horaSeleccionada!).subscribe(

            res => {
                this.cargarHorasExtra();
                this.horaSeleccionada = null;
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
