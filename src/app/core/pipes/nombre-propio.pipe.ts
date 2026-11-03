import { Pipe, PipeTransform } from '@angular/core';

const MINUSCULAS = ['a', 'al', 'de', 'del', 'e', 'en', 'la', 'las', 'los', 'o', 'para', 'por', 'u', 'y'];
const SIGLAS = ['saf', 'uigev'];

/**
 * Como `titlecase`, pero deja en minúscula artículos y preposiciones:
 * "SECRETARÍA DE ADMINISTRACIÓN Y FINANZAS" -> "Secretaría de Administración y Finanzas"
 */
@Pipe({
  name: 'nombrePropio',
  standalone: true,
})
export class NombrePropioPipe implements PipeTransform {
  transform(valor?: string | null): string {
    return (valor ?? '')
      .trim()
      .toLocaleLowerCase('es-MX')
      .split(/\s+/)
      .map((palabra, i) => {
        if (SIGLAS.includes(palabra)) return palabra.toLocaleUpperCase('es-MX');
        if (i > 0 && MINUSCULAS.includes(palabra)) return palabra;
        return palabra.charAt(0).toLocaleUpperCase('es-MX') + palabra.slice(1);
      })
      .join(' ');
  }
}
