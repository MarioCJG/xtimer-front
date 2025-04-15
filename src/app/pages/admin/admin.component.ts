import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { DarkModeService } from '../../services/dark-mode.service';


@Component({
  selector: 'app-admin',
  standalone: true,
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, FormsModule, HttpClientModule] // Importar módulos necesarios
})

export class AdminComponent {
  nombreCliente: string = ''; // Campo para el nombre del cliente
  contactoCliente: string = ''; // Campo para el contacto
  emailCliente: string = ''; // Campo para el email
  telefonoCliente: string = ''; // Campo para el teléfono
  mensaje: string = ''; // Mensaje de éxito o error

  // Campos para el formulario de áreas
  nombreArea: string = '';
  mensajeArea: string = '';

  // Campos para el formulario de áreas
  nombreCargo: string = '';
  mensajeCargo: string = '';

  // Campos para el formulario de proyectos
  nombreProyecto: string = '';
  descripcionProyecto: string = '';
  idClienteSeleccionado: number | null = null;
  consultoresSeleccionados: number[] = [];
  mensajeProyecto: string = '';

  // Listas de clientes y consultores
  clientes: any[] = [];
  consultores: any[] = [];

  // Campos para asignar consultores a proyectos existentes
  idProyectoSeleccionado: number | null = null;
  consultoresAsignados: number[] = [];
  proyectos: any[] = [];
  mensajeAsignacion: string = '';

  // Propiedades para el formulario de creación de usuarios y consultores
  emailUsuario: string = '';
  nombreConsultor: string = '';
  apellidoConsultor: string = '';
  idCargoSeleccionado: number | null = null;
  idRolSeleccionado: number | null = null;
  idAreaSeleccionada: number | null = null;
  mensajeUsuario: string = '';

  // Listas de cargos y roles
  cargos: any[] = [];
  roles: any[] = [];
  areas: any[] = [];

  asignaciones: any[] = []; // Inicializar como un arreglo vacío

  constructor(private http: HttpClient, public darkModeService: DarkModeService) { }

  ngOnInit() {
    this.cargarClientes();
    this.cargarConsultores();
    this.cargarProyectos();
    this.cargarCargos();
    this.cargarRoles();
    this.cargarAreas();

    this.mostrarSeccion("crearCliente");

    this.darkModeService.aplicarModo(); // Aplica el modo guardado al cargar


  }

  seccionActiva: string = ''; // Variable para rastrear la sección activa

  mostrarSeccion(seccion: string) {
    this.seccionActiva = seccion; // Cambiar la sección activa
  }

  onCargoChange(event: any) {
    console.log('Cargo seleccionado:', this.idCargoSeleccionado);
  }

  onRolChange(event: any) {
    console.log('Rol seleccionado:', this.idRolSeleccionado);
  }

  onAreaChange(event: any) {
    console.log('Área seleccionada:', this.idAreaSeleccionada);
  }

  cargarCargos() {
    this.http.get<any[]>('http://localhost:3000/api/cargos').subscribe(
      res => {
        this.cargos = res;
        console.log('Cargos cargados:', this.cargos); // Verificar los datos de cargos
      },
      err => {
        console.error('Error al cargar cargos:', err);
      }
    );
  }

  cargarRoles() {
    this.http.get<any[]>('http://localhost:3000/api/roles').subscribe(
      res => {
        this.roles = res;
        console.log('Roles cargados:', this.roles); // Verificar los datos de roles
      },
      err => {
        console.error('Error al cargar roles:', err);
      }
    );
  }

  cargarAreas() {
    this.http.get<any[]>('http://localhost:3000/api/areas').subscribe(
      res => {
        this.areas = res;
        console.log('Áreas cargadas:', this.areas); // Verificar los datos de áreas
      },
      err => {
        console.error('Error al cargar áreas:', err);
      }
    );
  }

  cargarClientes() {
    this.http.get<any[]>('http://localhost:3000/api/clientes').subscribe(
      res => {
        this.clientes = res;
      },
      err => {
        console.error('Error al cargar clientes:', err);
      }
    );
  }

  cargarConsultores() {
    this.http.get<any[]>('http://localhost:3000/api/consultores').subscribe(
      res => {
        this.consultores = res;
      },
      err => {
        console.error('Error al cargar consultores:', err);
      }
    );
  }

  cargarProyectos() {
    this.http.get<any[]>('http://localhost:3000/api/proyectos').subscribe(
      res => {
        this.proyectos = res;
      },
      err => {
        console.error('Error al cargar proyectos:', err);
      }
    );
  }

  cargarConsultoresAsignados() {

    console.log("Consultores asignados a proyecto:", this.consultoresAsignados);
    console.log(this.consultores);
    if (!this.idProyectoSeleccionado) return;

    this.http
      .get<any[]>(`http://localhost:3000/api/proyectos-asignados/${this.idProyectoSeleccionado}`)
      .subscribe(
        res => {
          // Actualizar la lista de consultores asignados
          this.consultoresAsignados = res.map(asignacion => asignacion.id_usuario);

          // Sincronizar la lista de asignaciones
          this.asignaciones = this.consultoresAsignados.map(idConsultor => ({
            id_usuario: idConsultor,
            id_proyecto: this.idProyectoSeleccionado
          }));

          console.log('Consultores asignados cargados:', this.consultoresAsignados);
          console.log('Asignaciones sincronizadas:', this.asignaciones);
        },
        err => {
          console.error('Error al cargar consultores asignados:', err);
        }
      );
  }

  toggleConsultorAsignado(consultor: any, event: any) {
    if (event.target.checked) {
      // Agregar el consultor a la lista de asignados
      if (!this.consultoresAsignados.includes(consultor.id_consultor)) {
        this.consultoresAsignados.push(consultor.id_consultor);
      }
    } else {
      // Eliminar el consultor de la lista de asignados
      this.consultoresAsignados = this.consultoresAsignados.filter(
        id => id !== consultor.id_consultor
      );

      // Reiniciar el valor por hora si se deselecciona
      consultor.valor_hora = null;
    }

    console.log('Consultores asignados:', this.consultoresAsignados);
  }

  guardarAsignaciones(asignaciones: any) {
    console.log('Asignaciones a guardar:', this.asignaciones);

    // Imprimir cada asignación con el valor por hora
    this.asignaciones.forEach(asignacion => {
      const consultor = this.consultores.find(c => c.id_consultor === asignacion.id_usuario);
      console.log(`Consultor ID: ${asignacion.id_usuario}, Proyecto ID: ${asignacion.id_proyecto}, Valor por hora: ${consultor?.valor_hora || 0}`);
    });

    // Verificar si la lista de asignaciones está vacía
    if (!this.asignaciones || this.asignaciones.length === 0) {
      console.warn('Advertencia: El proyecto quedará sin ninguna asignación.');
    }

    // Enviar la lista de asignaciones al backend
    this.http.post('http://localhost:3000/api/proyectos-asignados/actualizar', this.asignaciones).subscribe(
      res => {
        console.log('Asignaciones actualizadas con éxito:', res);
        this.mensajeAsignacion = 'Asignaciones guardadas correctamente.';
      },
      err => {
        console.error('Error al guardar asignaciones:', err);
        this.mensajeAsignacion = 'Error al guardar las asignaciones.';
      }
    );
  }

  crearCliente() {
    if (!this.nombreCliente.trim() || !this.contactoCliente.trim() || !this.emailCliente.trim() || !this.telefonoCliente.trim()) {
      this.mensaje = 'Todos los campos son obligatorios.';
      return;
    }

    const nuevoCliente = {
      nombre: this.nombreCliente,
      contacto: this.contactoCliente,
      email: this.emailCliente,
      telefono: this.telefonoCliente
    };

    this.http.post('http://localhost:3000/api/clientes', nuevoCliente).subscribe(
      res => {
        this.mensaje = 'Cliente creado con éxito.';
        this.limpiarFormulario(); // Limpiar los campos
      },
      err => {
        console.error('Error al crear el cliente:', err);
        this.mensaje = 'Error al crear el cliente.';
      }
    );
  }

  limpiarFormulario() {
    this.nombreCliente = '';
    this.contactoCliente = '';
    this.emailCliente = '';
    this.telefonoCliente = '';
  }

  // Método para crear un área
  crearArea() {
    if (!this.nombreArea.trim()) {
      this.mensajeArea = 'El nombre del área es obligatorio.';
      return;
    }

    const nuevaArea = { nombre: this.nombreArea };

    this.http.post('http://localhost:3000/api/areas', nuevaArea).subscribe(
      res => {
        this.mensajeArea = 'Área creada con éxito.';
        this.limpiarFormularioArea();
      },
      err => {
        console.error('Error al crear el área:', err);
        this.mensajeArea = 'Error al crear el área.';
      }
    );
  }

  limpiarFormularioArea() {
    this.nombreArea = '';
  }

  // Método para crear un área
  crearCargo() {
    if (!this.nombreCargo.trim()) {
      this.mensajeCargo = 'El nombre del área es obligatorio.';
      return;
    }

    const nuevaArea = { nombre: this.nombreCargo };

    this.http.post('http://localhost:3000/api/cargos', nuevaArea).subscribe(
      res => {
        this.mensajeCargo = 'Área creada con éxito.';
        this.limpiarFormularioArea();
      },
      err => {
        console.error('Error al crear el área:', err);
        this.mensajeCargo = 'Error al crear el área.';
      }
    );
  }

  limpiarFormularioCargo() {
    this.nombreCargo = '';
  }

  toggleConsultorSeleccionado(idConsultor: number, event: any) {
    if (event.target.checked) {
      this.consultoresSeleccionados.push(idConsultor);
    } else {
      this.consultoresSeleccionados = this.consultoresSeleccionados.filter(id => id !== idConsultor);
    }
  }

  crearProyecto() {
    if (!this.nombreProyecto.trim() || !this.descripcionProyecto.trim() || !this.idClienteSeleccionado) {
      this.mensajeProyecto = 'Todos los campos son obligatorios.';
      return;
    }

    const nuevoProyecto = {
      nombre: this.nombreProyecto,
      descripcion: this.descripcionProyecto,
      estado: 'pendiente',
      id_cliente: this.idClienteSeleccionado
    };

    this.http.post('http://localhost:3000/api/proyectos', nuevoProyecto).subscribe(
      (res: any) => {
        const idProyecto = res.id; // ID del proyecto recién creado
        this.asignarConsultores(idProyecto);
      },
      err => {
        console.error('Error al crear el proyecto:', err);
        this.mensajeProyecto = 'Error al crear el proyecto.';
      }
    );
  }

  asignarConsultores(idProyecto: number) {
    const asignaciones = this.consultores
      .filter(consultor => this.consultoresSeleccionados.includes(consultor.id_consultor))
      .map(consultor => ({
        id_usuario: consultor.id_consultor,
        id_proyecto: idProyecto,
        valor_hora: consultor.valor_hora || 0 // Asegúrate de enviar un valor por defecto si no se ingresó
      }));

    console.log('Datos enviados al backend para asignar consultores:', asignaciones);

    this.http.post('http://localhost:3000/api/proyectos-asignados', asignaciones).subscribe(
      res => {
        this.mensajeProyecto = 'Proyecto creado y consultores asignados con éxito.';
        this.limpiarFormularioProyecto();
      },
      err => {
        console.error('Error al asignar consultores:', err);
        this.mensajeProyecto = 'Error al asignar consultores.';
      }
    );
  }

  limpiarFormularioProyecto() {
    this.nombreProyecto = '';
    this.descripcionProyecto = '';
    this.idClienteSeleccionado = null;
    this.consultoresSeleccionados = [];
  }

  generarContraseña(): string {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let contraseña = '';
    for (let i = 0; i < 8; i++) {
      contraseña += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return contraseña; // Cambiar a contraseña generada
  }

  crearUsuario() {
    if (!this.emailUsuario.trim()) {
      this.mensajeUsuario = 'El correo electrónico es obligatorio.';
      return;
    }

    const contraseñaGenerada = this.generarContraseña();

    // Enviar datos al backend
    this.http.post('http://localhost:3000/api/usuarios', { email: this.emailUsuario, password: contraseñaGenerada }).subscribe(
      res => {
        this.mensajeUsuario = `Usuario creado con éxito. Contraseña generada: ${contraseñaGenerada}`;
        this.emailUsuario = ''; // Limpiar el campo
      },
      err => {
        console.error('Error al crear el usuario:', err);
        this.mensajeUsuario = 'Error al crear el usuario.';
      }
    );
  }

  crearUsuarioYConsultor() {

    if (
      !this.emailUsuario.trim() ||
      !this.nombreConsultor.trim() ||
      !this.apellidoConsultor.trim() ||
      !this.idCargoSeleccionado ||
      !this.idRolSeleccionado ||
      !this.idAreaSeleccionada
    ) {
      this.mensajeUsuario = 'Todos los campos son obligatorios.';
      return;
    }

    const contraseñaGenerada = this.generarContraseña();

    console.log('Datos a enviar:', {
      email: this.emailUsuario,
      password: contraseñaGenerada,
      nombre: this.nombreConsultor,
      apellido: this.apellidoConsultor,
      id_cargo: this.idCargoSeleccionado,
      id_rol: this.idRolSeleccionado,
      id_area: this.idAreaSeleccionada
    });

    // Enviar datos al backend
    this.http.post('http://localhost:3000/api/usuarios-consultores', {
      email: this.emailUsuario,
      password: contraseñaGenerada,
      nombre: this.nombreConsultor,
      apellido: this.apellidoConsultor,
      id_cargo: this.idCargoSeleccionado,
      id_rol: this.idRolSeleccionado,
      id_area: this.idAreaSeleccionada
    }).subscribe(
      res => {
        this.mensajeUsuario = `Usuario y consultor creados con éxito. Contraseña generada: ${contraseñaGenerada}`;
        this.limpiarFormularioUsuarioYConsultor();
      },
      err => {
        console.error('Error al crear el usuario y consultor:', err);
        this.mensajeUsuario = 'Error al crear el usuario y consultor.';
      }
    );
  }

  limpiarFormularioUsuarioYConsultor() {
    this.emailUsuario = '';
    this.nombreConsultor = '';
    this.apellidoConsultor = '';
    this.idCargoSeleccionado = null;
    this.idRolSeleccionado = null;
    this.idAreaSeleccionada = null;
  }
}