import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filterFecha',
    standalone: true
})
export class FilterFechaPipe implements PipeTransform {
    transform(items: any[], filtroFecha: string): any[] {
        if (!items || !filtroFecha) {
            return items;
        }
        return items.filter(item => item.fecha === filtroFecha);
    }
}
