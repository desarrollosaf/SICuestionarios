import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbCalendar, NgbDatepickerModule, NgbDateStruct, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { ApexOptions, NgApexchartsModule } from "ng-apexcharts";
import { FeatherIconDirective } from '../../../core/feather-icon/feather-icon.directive';
import { ThemeCssVariableService, ThemeCssVariablesType } from '../../../core/services/theme-css-variable.service';
import { NgSelectModule } from '@ng-select/ng-select';

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

  dependencia = [
    { id: '1', nombre_completo:'LEGISLATURA' },
    { id: '2',nombre_completo:'SECRETARÍA DE ASUNTOS PARLAMENTARIOS'},
    { id: '3', nombre_completo:'ÓRGANO SUPERIOR DE FISCALIZACIÓN DEL ESTADO DE MÉXICO' },
    { id: '4', nombre_completo:'SECRETARÍA DE ADMINISTRACIÓN Y FINANZAS' },
    { id: '5', nombre_completo:'DIRECCIÓN GENERAL DE COMUNICACIÓN SOCIAL' },
    { id: '6', nombre_completo:'CONTRALORÍA' },
    { id: '7', nombre_completo:'INSTITUTO DE ESTUDIOS LEGISLATIVOS' },
    { id: '8', nombre_completo:'UNIDAD DE INFORMACIÓN' },
  ];

  constructor() {
  }

  ngOnInit(): void {
  }
}
