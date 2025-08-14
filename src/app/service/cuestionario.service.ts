import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable, signal, inject, computed } from '@angular/core';
import { enviroment } from '../../enviroments/enviroment'; 
@Injectable({
  providedIn: 'root'
})
export class CuestionarioService {
  private myAppUrl: string;
  private myAPIUrl: string;
  private http = inject( HttpClient );
  constructor() {
        this.myAppUrl = enviroment.endpoint;
        this.myAPIUrl ='api/preguntas';
  }

  getPreguntas(): Observable<string> {
    return this.http.get<string>(`${this.myAppUrl}${this.myAPIUrl}/getpreguntas`)
  }

}
