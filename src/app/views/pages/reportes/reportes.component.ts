import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, of, catchError, Observable } from 'rxjs';
import { AnioCuestionario, ReporteService } from '../../../service/reporte.service';
import { NombrePropioPipe } from '../../../core/pipes/nombre-propio.pipe';

import Swal from 'sweetalert2';

interface DependenciaTotal {
  dependencia: string;
  hombres: number;
  mujeres: number;
  total: number;
}

interface PreguntaComparada {
  texto: string;
  total: number;
  // texto de opción normalizado -> { nombre original, respuestas }
  opciones: Map<string, { nombre: string; total: number }>;
}

interface Comparacion {
  anio: number;
  tHombres: number;
  tMujeres: number;
  totalesPorDependencia: Map<string, number>;
  porTexto: Map<string, PreguntaComparada>;
  // [sección][pregunta], para emparejar preguntas que cambiaron ligeramente de redacción
  porPosicion: PreguntaComparada[][];
}

// Compara textos sin importar acentos, mayúsculas, signos ni "(opcional)"
const normalizar = (texto?: string | null): string =>
  (texto || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\(opcional\)/g, '')
    .replace(/[^a-z0-9ñ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Parecido entre dos textos (0 a 1) según las palabras que comparten
const parecido = (a: string, b: string): number => {
  const pa = new Set(a.split(' ').filter(Boolean));
  const pb = new Set(b.split(' ').filter(Boolean));
  if (!pa.size || !pb.size) return 0;
  const comunes = [...pa].filter(p => pb.has(p)).length;
  return comunes / new Set([...pa, ...pb]).size;
};
const PARECIDO_MINIMO = 0.6;

@Component({
  selector: 'app-reportes',
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    NgbTooltipModule,
    NombrePropioPipe,
  ],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss'
})
export class ReportesComponent implements OnInit {
  public dependencia: any[] = [];
  generoSlct = [
    { id: 'Hombre', name: 'Masculino' },
    { id: 'Mujer', name: 'Femenino' }
  ];
  selectedDependencia: number | null = null;
  selectedGenero: string | null = null;
  data: any[] = [];
  dependencias: DependenciaTotal[] = [];
  tHombres = 0;
  tMujeres = 0;
  maxTotalDependencia = 0;

  anios: AnioCuestionario[] = [];
  anioSeleccionado: number | null = null;
  anioComparar: number | null = null;
  comparacion: Comparacion | null = null;
  cargandoComparacion = false;
  // idPregunta del año seleccionado -> pregunta equivalente del año comparado
  private emparejadas = new Map<string, PreguntaComparada>();

  cargandoTotales = true;
  cargandoResultados = true;
  descargando = false;
  errorResultados = false;
  seccionActiva = 0;

  // Filtros con los que se obtuvieron los resultados que se muestran
  filtroAplicado: { dependencia: string | null; genero: string | null } = { dependencia: null, genero: null };
  private filtroValores: { id_dependencia: number | null; genero: string | null } = { id_dependencia: null, genero: null };

  constructor(private _reporteService: ReporteService) { }

  ngOnInit(): void {
    this.getDependencias();
    this._reporteService.getAnios().subscribe({
      next: (response) => {
        this.anios = response.data || [];
        // Por defecto, el año activo (el que se está contestando)
        this.anioSeleccionado = (this.anios.find(a => a.activo) ?? this.anios[0])?.anio ?? null;
        this.cargarAnio();
      },
      error: (e: HttpErrorResponse) => {
        console.error(e);
        this.cargarAnio();
      },
    });
  }

  // ---------- Años ----------

  get aniosParaComparar(): AnioCuestionario[] {
    return this.anios.filter(a => a.anio !== this.anioSeleccionado);
  }

  seleccionarAnio(anio: number) {
    if (anio === this.anioSeleccionado) return;
    this.anioSeleccionado = anio;
    if (this.anioComparar === anio) this.anioComparar = null;
    this.cargarAnio();
  }

  cambiarComparacion() {
    this.cargarComparacion();
  }

  private cargarAnio() {
    this.getTotalesDep();
    this.recargarResultados();
  }

  private recargarResultados() {
    if (this.filtroValores.id_dependencia || this.filtroValores.genero) {
      this.cargarResultados(
        this._reporteService.getCuestionariosDep({ ...this.filtroValores, anio: this.anioSeleccionado }),
        this.filtroAplicado
      );
    } else {
      this.cargarResultados(this._reporteService.getCuestionarios(this.anioSeleccionado), { dependencia: null, genero: null });
    }
    this.cargarComparacion();
  }

  // Trae los mismos datos (con los mismos filtros) del año con el que se compara
  private cargarComparacion() {
    const anio = this.anioComparar;
    if (!anio) {
      this.comparacion = null;
      this.emparejar();
      return;
    }
    this.cargandoComparacion = true;
    const hayFiltro = this.filtroValores.id_dependencia || this.filtroValores.genero;
    const resultados$: Observable<any> = hayFiltro
      ? this._reporteService.getCuestionariosDep({ ...this.filtroValores, anio })
      : this._reporteService.getCuestionarios(anio);
    forkJoin({
      totales: this._reporteService.getTotalesDep(anio).pipe(catchError(() => of({ data: [] }))),
      resultados: resultados$.pipe(catchError(() => of({ data: [] }))),
    }).subscribe(({ totales, resultados }) => {
      if (this.anioComparar !== anio) return; // cambió mientras cargaba
      const totalesPorDependencia = new Map<string, number>();
      let tHombres = 0;
      let tMujeres = 0;
      (totales.data || []).forEach((d: any) => {
        totalesPorDependencia.set(d.dependencia, (d.hombres || 0) + (d.mujeres || 0));
        tHombres += d.hombres || 0;
        tMujeres += d.mujeres || 0;
      });
      const porTexto = new Map<string, PreguntaComparada>();
      const porPosicion: PreguntaComparada[][] = (resultados.data || []).map((s: any) =>
        (s.preguntas || []).map((p: any) => {
          const opciones = new Map<string, { nombre: string; total: number }>();
          (p.opciones || []).forEach((o: any) =>
            opciones.set(normalizar(o.nombreOpcion), { nombre: o.nombreOpcion, total: o.totalRespuestas || 0 })
          );
          const comparada = { texto: p.nombrePregunta, total: this.totalPregunta(p), opciones };
          porTexto.set(normalizar(p.nombrePregunta), comparada);
          return comparada;
        })
      );
      this.comparacion = { anio, tHombres, tMujeres, totalesPorDependencia, porTexto, porPosicion };
      this.emparejar();
      this.cargandoComparacion = false;
    });
  }

  // ---------- Comparación ----------

  /**
   * Empareja cada pregunta del año seleccionado con la del año comparado: primero por texto;
   * si no aparece, la de la misma sección y número siempre que el texto sea parecido
   * (p. ej. "se toma en cuenta" / "se toman en cuenta").
   */
  private emparejar() {
    this.emparejadas = new Map();
    const comp = this.comparacion;
    if (!comp) return;
    this.data.forEach((s: any, i: number) => (s.preguntas || []).forEach((p: any, j: number) => {
      const clave = normalizar(p.nombrePregunta);
      let par = comp.porTexto.get(clave);
      if (!par) {
        const candidata = comp.porPosicion[i]?.[j];
        if (candidata && parecido(clave, normalizar(candidata.texto)) >= PARECIDO_MINIMO) par = candidata;
      }
      if (par) this.emparejadas.set(p.idPregunta, par);
    }));
  }

  private preguntaComparada(pregunta: any): PreguntaComparada | undefined {
    return this.emparejadas.get(pregunta?.idPregunta);
  }

  // Texto con el que se hizo la pregunta en el año comparado, si cambió la redacción
  textoAnterior(pregunta: any): string | null {
    const par = this.preguntaComparada(pregunta);
    if (!par || normalizar(par.texto) === normalizar(pregunta?.nombrePregunta)) return null;
    return par.texto;
  }

  // Las opciones no son las mismas en ambos años: la comparación es sólo de referencia
  opcionesCambiaron(pregunta: any): boolean {
    const par = this.preguntaComparada(pregunta);
    if (!par) return false;
    const actuales = new Set<string>((pregunta?.opciones || []).map((o: any) => normalizar(o.nombreOpcion)));
    return actuales.size !== par.opciones.size || [...par.opciones.keys()].some(k => !actuales.has(k));
  }

  // Opciones que existían en el año comparado y ya no están, con su porcentaje
  opcionesSoloAnteriores(pregunta: any): { nombre: string; pct: number }[] {
    const par = this.preguntaComparada(pregunta);
    if (!par) return [];
    const actuales = new Set<string>((pregunta?.opciones || []).map((o: any) => normalizar(o.nombreOpcion)));
    return [...par.opciones.entries()]
      .filter(([k]) => !actuales.has(k))
      .map(([, v]) => ({ nombre: v.nombre, pct: this.porcentaje(v.total, par.total) }));
  }

  existeEnComparacion(pregunta: any): boolean {
    return !!this.preguntaComparada(pregunta);
  }

  totalComparado(pregunta: any): number {
    return this.preguntaComparada(pregunta)?.total ?? 0;
  }

  // % de la opción en el año comparado, o null si esa opción no existía
  porcentajeComparado(pregunta: any, opcion: any): number | null {
    const p = this.preguntaComparada(pregunta);
    if (!p) return null;
    const valor = p.opciones.get(normalizar(opcion.nombreOpcion));
    if (valor === undefined) return null;
    return this.porcentaje(valor.total, p.total);
  }

  // Diferencia en puntos porcentuales contra el año comparado (sólo si las opciones son las mismas)
  diferencia(pregunta: any, opcion: any): number | null {
    if (this.opcionesCambiaron(pregunta)) return null;
    const anterior = this.porcentajeComparado(pregunta, opcion);
    if (anterior === null || !this.totalPregunta(pregunta) || !this.totalComparado(pregunta)) return null;
    return this.porcentaje(opcion.totalRespuestas, this.totalPregunta(pregunta)) - anterior;
  }

  totalDependenciaComparado(dep: DependenciaTotal): number | null {
    return this.comparacion?.totalesPorDependencia.get(dep.dependencia) ?? null;
  }

  get totalPersonasComparado(): number {
    return (this.comparacion?.tHombres ?? 0) + (this.comparacion?.tMujeres ?? 0);
  }

  // ---------- Indicadores ----------

  get totalPersonas(): number {
    return this.tHombres + this.tMujeres;
  }

  get dependenciasConParticipacion(): number {
    return this.dependencias.filter(d => d.total > 0).length;
  }

  get hayFiltros(): boolean {
    return !!this.selectedDependencia || !!this.selectedGenero;
  }

  get hayFiltroAplicado(): boolean {
    return !!this.filtroAplicado.dependencia || !!this.filtroAplicado.genero;
  }

  porcentaje(valor: number, total: number): number {
    return total ? Math.round((valor / total) * 100) : 0;
  }

  // ---------- Resultados por pregunta ----------

  totalPregunta(pregunta: any): number {
    return (pregunta?.opciones || []).reduce((acc: number, o: any) => acc + (o.totalRespuestas || 0), 0);
  }

  maxPregunta(pregunta: any): number {
    return Math.max(0, ...(pregunta?.opciones || []).map((o: any) => o.totalRespuestas || 0));
  }

  esMasElegida(pregunta: any, opcion: any): boolean {
    const max = this.maxPregunta(pregunta);
    return max > 0 && opcion.totalRespuestas === max;
  }

  // Misma numeración que el cuestionario: la primera sección (datos generales) no se numera
  numeroPregunta(seccionIndex: number, preguntaIndex: number): number | null {
    if (seccionIndex < 1) return null;
    let total = 0;
    for (let i = 1; i < seccionIndex; i++) {
      total += this.data[i]?.preguntas?.length || 0;
    }
    return total + preguntaIndex + 1;
  }

  seleccionarSeccion(index: number) {
    this.seccionActiva = index;
  }

  // ---------- Datos ----------

  getDependencias() {
    this._reporteService.getDependencias().subscribe({
      next: (response) => {
        this.dependencia = response.data
      },
      error: (e: HttpErrorResponse) => {
        console.error(e);
      },
    });
  }

  getResultados() {
    if (!this.selectedDependencia && !this.selectedGenero) {
      Swal.fire({
        position: "center",
        icon: "warning",
        title: "¡Atención!",
        text: `Selecciona al menos una opción`,
        showConfirmButton: false,
        timer: 2000
      });
      return;
    }

    this.filtroValores = {
      id_dependencia: this.selectedDependencia,
      genero: this.selectedGenero,
    };
    this.filtroAplicado = {
      dependencia: this.nombreDependencia(this.selectedDependencia),
      genero: this.generoSlct.find(g => g.id === this.selectedGenero)?.name ?? null,
    };
    this.recargarResultados();
  }

  limpiarFiltros() {
    this.selectedDependencia = null;
    this.selectedGenero = null;
    this.showAllData();
  }

  showAllData() {
    this.filtroValores = { id_dependencia: null, genero: null };
    this.filtroAplicado = { dependencia: null, genero: null };
    this.recargarResultados();
  }

  private cargarResultados(peticion: ReturnType<ReporteService['getCuestionarios']>, filtro: { dependencia: string | null; genero: string | null }) {
    this.cargandoResultados = true;
    this.errorResultados = false;
    peticion.subscribe({
      next: (response) => {
        this.data = response.data || [];
        this.filtroAplicado = filtro;
        this.emparejar();
        if (this.seccionActiva >= this.data.length) this.seccionActiva = 0;
        this.cargandoResultados = false;
      },
      error: (e: HttpErrorResponse) => {
        console.error(e);
        this.data = [];
        this.errorResultados = true;
        this.cargandoResultados = false;
      },
    });
  }

  private nombreDependencia(id: number | null): string | null {
    if (!id) return null;
    return this.dependencia.find(d => d.id_Dependencia === id)?.nombre_completo ?? null;
  }

  getExcelF() {
    if (!this.selectedDependencia) {
      Swal.fire({
        position: "center",
        icon: "warning",
        title: "¡Atención!",
        text: `Selecciona una dependencia`,
        showConfirmButton: false,
        timer: 2000
      });
      return;
    }

    const valores = {
      'id_dependencia': this.selectedDependencia,
      'anio': this.anioSeleccionado,
    }

    this.descargando = true;
    this._reporteService.getExcelF(valores).subscribe({
      next: (response: Blob) => {
        const nombreDependencia = this.nombreDependencia(this.selectedDependencia) || 'sin_nombre';
        const blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${nombreDependencia}_contestados_${this.anioSeleccionado ?? ''}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.descargando = false;
      },
      error: (e: HttpErrorResponse) => {
        console.error('Error al descargar Excel:', e.error?.msg || e);
        this.descargando = false;
        Swal.fire({
          position: 'center',
          icon: 'error',
          title: 'Ocurrió un error al descargar el archivo.',
          showConfirmButton: false,
          timer: 2000
        });
      }
    });
  }

  getTotalesDep() {
    this.cargandoTotales = true;
    this._reporteService.getTotalesDep(this.anioSeleccionado).subscribe({
      next: (response) => {
        this.dependencias = (response.data || [])
          .map((dep: any) => ({
            dependencia: dep.dependencia,
            hombres: dep.hombres || 0,
            mujeres: dep.mujeres || 0,
            total: (dep.hombres || 0) + (dep.mujeres || 0),
          }))
          .sort((a: DependenciaTotal, b: DependenciaTotal) => b.total - a.total);
        this.tHombres = this.dependencias.reduce((acc, d) => acc + d.hombres, 0);
        this.tMujeres = this.dependencias.reduce((acc, d) => acc + d.mujeres, 0);
        this.maxTotalDependencia = Math.max(0, ...this.dependencias.map(d => d.total));
        this.cargandoTotales = false;
      },
      error: (e: HttpErrorResponse) => {
        console.error(e);
        this.cargandoTotales = false;
      },
    });
  }
}
