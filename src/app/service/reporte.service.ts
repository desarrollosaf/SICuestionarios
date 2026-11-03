import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable, inject } from '@angular/core';
import { enviroment } from '../../enviroments/enviroment';

export interface AnioCuestionario {
  anio: number;
  titulo: string;
  activo: boolean;
  personas: number;
}

// Todos los reportes aceptan `anio`; si no se manda, el back usa el cuestionario activo
@Injectable({
  providedIn: 'root',
})
export class ReporteService {
  private myAppUrl: string;
  private myAPIUrl: string;
  private myAPIUrl2: string;
  private http = inject(HttpClient);
  constructor() {
    this.myAppUrl = enviroment.endpoint;
    this.myAPIUrl = 'api/preguntas';
    this.myAPIUrl2 = 'api/combos';
  }

  private params(anio?: number | null): HttpParams {
    return anio ? new HttpParams().set('anio', anio) : new HttpParams();
  }

  getDependencias(): Observable<any> {
    return this.http.get<any>(
      `${this.myAppUrl}${this.myAPIUrl2}/getdependencias`
    );
  }

  getAnios(): Observable<{ data: AnioCuestionario[] }> {
    return this.http.get<{ data: AnioCuestionario[] }>(`${this.myAppUrl}${this.myAPIUrl}/getanios`);
  }

  getCuestionarios(anio?: number | null): Observable<any> {
    return this.http.get<any>(
      `${this.myAppUrl}${this.myAPIUrl}/getcuestionarios`, { params: this.params(anio) }
    );
  }

  getCuestionariosDep(valores: any): Observable<any> {
    return this.http.post<any>(
      `${this.myAppUrl}${this.myAPIUrl}/getcuestionariosdep`, valores
    );
  }

  getTotalesDep(anio?: number | null): Observable<any> {
    return this.http.get<any>(
      `${this.myAppUrl}${this.myAPIUrl}/gettotalesdep`, { params: this.params(anio) }
    );
  }

  getServidoresPublicos(anio?: number | null): Observable<any> {
    return this.http.get<any>(
      `${this.myAppUrl}${this.myAPIUrl}/getcuestionariosus`, { params: this.params(anio) }
    );
  }

  getRespuestasUsuario(rfc: string, anio?: number | null): Observable<any> {
    return this.http.get<any>(
      `${this.myAppUrl}${this.myAPIUrl}/getrespuestasusuario/${encodeURIComponent(rfc)}`, { params: this.params(anio) }
    );
  }

  getExcelF(valores: any): Observable<Blob> {
    return this.http.post(`${this.myAppUrl}${this.myAPIUrl}/getExcelFaltantes`, valores, {
      responseType: 'blob' as 'blob',
    });
  }

}
