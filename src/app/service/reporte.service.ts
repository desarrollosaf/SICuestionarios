import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable, signal, inject, computed } from '@angular/core';
import { enviroment } from '../../enviroments/enviroment';
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

  getDependencias(): Observable<any> {
    return this.http.get<any>(
      `${this.myAppUrl}${this.myAPIUrl2}/getdependencias`
    );
  }

   getCuestionarios(): Observable<any> {
    return this.http.get<any>(
      `${this.myAppUrl}${this.myAPIUrl}/getcuestionarios`
    );
  }
}
