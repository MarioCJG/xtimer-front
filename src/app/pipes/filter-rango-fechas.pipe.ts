import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterRangoFechas',
  standalone: true // Esto permite usar el Pipe sin necesidad de declararlo en un módulo
})
export class FilterRangoFechasPipe implements PipeTransform {
  transform(horasExtra: any[], desde: string, hasta: string): any[] {
    if (!horasExtra) return [];
    if (!desde && !hasta) return horasExtra;

    const desdeFecha = desde ? new Date(desde) : null;
    const hastaFecha = hasta ? new Date(hasta) : null;

    return horasExtra.filter(hora => {
      const fechaHora = new Date(hora.fecha);
      if (desdeFecha && fechaHora < desdeFecha) return false;
      if (hastaFecha && fechaHora > hastaFecha) return false;
      return true;
    });
  }
}