import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { AnioCuestionario, ReporteService } from '../../../../service/reporte.service';
import { PdfRespuestasService } from '../../../../service/pdf-respuestas.service';
import { NombrePropioPipe } from '../../../../core/pipes/nombre-propio.pipe';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-servidores-publicos',
  imports: [CommonModule, FormsModule, NgbPaginationModule, NgbTooltipModule, NgSelectModule, NombrePropioPipe],
  templateUrl: './servidores-publicos.component.html',
  styleUrl: './servidores-publicos.component.scss'
})
export class ServidoresPublicosComponent implements OnInit {
  originalData: any[] = [];
  temp: any[] = [];
  rows: any[] = [];
  page: number = 1;
  pageSize: number = 10;
  readonly pageSizes = [10, 25, 50];
  filteredCount: number = 0;
  loading: boolean = true;
  error = false;
  busqueda = '';
  filtroDependencia: string | null = null;
  dependencias: string[] = [];
  generandoPdf = new Set<string>();
  anios: AnioCuestionario[] = [];
  anioSeleccionado: number | null = null;

  constructor(private _reporteService: ReporteService, private _pdfService: PdfRespuestasService) { }

  ngOnInit(): void {
    this._reporteService.getAnios().subscribe({
      next: (response) => {
        this.anios = response.data || [];
        // Por defecto, el año activo (el que se está contestando)
        this.anioSeleccionado = (this.anios.find(a => a.activo) ?? this.anios[0])?.anio ?? null;
        this.getServidoresP();
      },
      error: () => this.getServidoresP(),
    });
  }

  seleccionarAnio(anio: number) {
    if (anio === this.anioSeleccionado) return;
    this.anioSeleccionado = anio;
    this.getServidoresP();
  }

  getServidoresP() {
    this.loading = true;
    this.error = false;
    this._reporteService.getServidoresPublicos(this.anioSeleccionado).subscribe({
      next: (response) => {
        this.originalData = [...response.data];
        this.dependencias = [...new Set(
          this.originalData.map(r => r.dependencia?.nombre_completo).filter(Boolean) as string[]
        )].sort();
        this.aplicarFiltros();
        this.loading = false;
      },
      error: (e: HttpErrorResponse) => {
        console.error(e);
        this.loading = false;
        this.error = true;
      },
    });
  }

  setPage(page: number) {
    this.page = page;
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.rows = this.temp.slice(start, end);
  }

  cambiarTamano() {
    this.setPage(1);
  }

  aplicarFiltros() {
    const val = this.normalizar(this.busqueda);
    this.temp = this.originalData.filter((row: any) => {
      if (this.filtroDependencia && row.dependencia?.nombre_completo !== this.filtroDependencia) {
        return false;
      }
      if (!val) return true;
      const nombre = this.normalizar(row.Nombre);
      const dependencia = this.normalizar(row.dependencia?.nombre_completo);
      const direccion = this.normalizar(row.direccion?.nombre_completo);
      const departamento = this.normalizar(row.departamento?.nombre_completo);
      return (
        nombre.includes(val) ||
        dependencia.includes(val) ||
        direccion.includes(val) ||
        departamento.includes(val)
      );
    });
    this.filteredCount = this.temp.length;
    this.setPage(1);
  }

  limpiarBusqueda() {
    this.busqueda = '';
    this.filtroDependencia = null;
    this.aplicarFiltros();
  }

  get hayFiltros(): boolean {
    return !!this.busqueda || !!this.filtroDependencia;
  }

  get rangoInicio(): number {
    return this.filteredCount ? (this.page - 1) * this.pageSize + 1 : 0;
  }

  get rangoFin(): number {
    return Math.min(this.page * this.pageSize, this.filteredCount);
  }

  // Ignora mayúsculas y acentos al buscar
  private normalizar(texto?: string | null): string {
    return (texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  iniciales(nombre?: string | null): string {
    return (nombre || '').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?';
  }

  descargarPDF(row: any) {
    const rfc = row.N_Usuario;
    if (!rfc || this.generandoPdf.has(rfc)) return;
    this.generandoPdf.add(rfc);
    this._reporteService.getRespuestasUsuario(rfc, this.anioSeleccionado).subscribe({
      next: async (response) => {
        try {
          await this._pdfService.generar(response.data);
        } catch (e) {
          console.error(e);
          this.errorPdf();
        }
        this.generandoPdf.delete(rfc);
      },
      error: (e: HttpErrorResponse) => {
        console.error(e);
        this.generandoPdf.delete(rfc);
        this.errorPdf(e.status === 404 ? 'Esta persona aún no tiene respuestas registradas.' : undefined);
      },
    });
  }

  private errorPdf(texto = 'Inténtalo de nuevo en un momento.') {
    Swal.fire({
      position: 'center',
      icon: 'error',
      title: 'No se pudo generar el PDF',
      text: texto,
      showConfirmButton: false,
      timer: 2500
    });
  }

}
