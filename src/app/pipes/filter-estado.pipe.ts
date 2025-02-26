import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filterEstado',
    standalone: true
})
export class FilterEstadoPipe implements PipeTransform {
    transform(items: any[], filtroEstado: string): any[] {
        if (!items || !filtroEstado) {
            return items;
        }
        return items.filter(item => item.estado === filtroEstado);
    }
}
