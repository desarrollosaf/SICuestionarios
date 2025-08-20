import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
  FormControl,
  AbstractControl
} from '@angular/forms';
import { NgbCalendar, NgbDatepickerModule, NgbDateStruct, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { ApexOptions, NgApexchartsModule } from "ng-apexcharts";
import { FeatherIconDirective } from '../../../core/feather-icon/feather-icon.directive';
import { ThemeCssVariableService, ThemeCssVariablesType } from '../../../core/services/theme-css-variable.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { ReporteService } from '../../../service/reporte.service';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartData, ChartConfiguration } from 'chart.js';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-reportes',
  imports: [
    CommonModule,
    NgbDropdownModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    NgApexchartsModule,
    FeatherIconDirective,
    NgSelectModule,
    NgbAccordionModule,
    BaseChartDirective

  ],
  providers: [
    provideCharts(withDefaultRegisterables())
  ],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss'
})
export class ReportesComponent {
  public dependencia: any[] = [];

  data: any[] = [];

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    animation: {
      duration: 0
    },
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0 }
      }
    }
  };

  constructor(private _reporteService: ReporteService) {
  }

  ngOnInit(): void {
    this.getDependencias();
    this._reporteService.getCuestionarios().subscribe({
      next: (response) => {
        console.log(response);
        this.data = response.data;
      },
      error: (e: HttpErrorResponse) => {
        console.error(e);
      },
    });
  }

  getChartData(pregunta: any): ChartData<'bar'> {
    const opciones = pregunta?.opciones || [];
    return {
      labels: opciones.map((o: any) => o.nombreOpcion),
      datasets: [
        {
          label: 'Total de respuestas',
          data: opciones.map((o: any) => o.totalRespuestas),
          backgroundColor: '#42A5F5'
        }
      ]
    };
  }

  getDependencias() {
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
