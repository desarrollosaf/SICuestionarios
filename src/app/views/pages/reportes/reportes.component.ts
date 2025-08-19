import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbCalendar, NgbDatepickerModule, NgbDateStruct, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { ApexOptions, NgApexchartsModule } from "ng-apexcharts";
import { FeatherIconDirective } from '../../../core/feather-icon/feather-icon.directive';
import { ThemeCssVariableService, ThemeCssVariablesType } from '../../../core/services/theme-css-variable.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { ReporteService } from '../../../service/reporte.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-reportes',
    imports: [
        NgbDropdownModule,
        FormsModule,
        NgbDatepickerModule,
        NgApexchartsModule,
        FeatherIconDirective,
        NgSelectModule
    ],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss'
})
export class ReportesComponent {
  public dependencia: any[] = [];

  constructor(private _reporteService: ReporteService) {
  }

  ngOnInit(): void {
    this.getDependencias();
  }

  getDependencias(){
      this._reporteService.getDependencias().subscribe({
      next: (response) => {
        console.log(response.data);
        this.dependencia = response.data
      },
      error: (e: HttpErrorResponse) => {
        console.error(e);
      },
    });
  }

  getResultados(dependencia: any) {
    console.log(dependencia);
  }
}
