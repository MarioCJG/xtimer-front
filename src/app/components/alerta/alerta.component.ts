import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-alerta',
    standalone: true,
    templateUrl: './alerta.component.html',
    styleUrls: ['./alerta.component.css'],
    imports: [NgIf]
})
export class AlertaComponent {
    @Input() mensaje: string = '';
    @Input() tipo: string = 'info'; // 'success', 'danger', 'warning'
}
