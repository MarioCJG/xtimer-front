import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-card',
    standalone: true,
    templateUrl: './card.component.html',
    styleUrls: ['./card.component.css'],
    imports: [NgIf]
})
export class CardComponent {
    @Input() titulo: string = 'Título';
    @Input() contenido: string = 'Contenido de la tarjeta';
    @Input() botonTexto: string = '';
    @Input() accion: () => void = () => {};
}
