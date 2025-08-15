import { Component, OnInit, inject, ViewChild, AfterViewInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CuestionarioService } from '../../../service/cuestionario.service';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ArchwizardModule, WizardComponent as BaseWizardComponent } from '@rg-software/angular-archwizard';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { WizardComponent } from '@rg-software/angular-archwizard';
import { MovingDirection } from '@rg-software/angular-archwizard';

@Component({
  selector: 'app-cuestionario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    NgbAccordionModule,
    ArchwizardModule,
  ],
  templateUrl: './cuestionario.component.html',
  styleUrls: ['./cuestionario.component.scss'],
})
export class CuestionarioComponent implements AfterViewInit {
  @ViewChild('wizardForm') wizardForm: WizardComponent;
  formCuestionario: FormGroup;
currentSectionTitle = '';
  constructor(private fb: FormBuilder, private _cuestionarioService: CuestionarioService) {
    this.formCuestionario = this.fb.group({
      secciones: this.fb.array([]),
    });
  }

  ngAfterViewInit() {
   
  }

  ngOnInit(): void {
    this.getPreguntas();
  }

  get seccionesArray(): FormArray {
    return this.formCuestionario.get('secciones') as FormArray;
  }

  getSeccionPreguntas(index: number): FormArray {
    return this.seccionesArray.at(index).get('preguntas') as FormArray;
  }

  getPreguntas() {
    this._cuestionarioService.getPreguntas().subscribe({
      next: (response) => {
        this.buildForm(response.data);
      },
      error: (e: HttpErrorResponse) => {
        console.error(e);
      },
    });
  }

  buildForm(secciones: any[]) {
    const seccionesFormArray = this.seccionesArray;

    secciones.forEach((data) => {
      const preguntasFormArray = new FormArray<FormGroup<any>>([]);

      data.m_preguntas.forEach((pregunta: any) => {
        preguntasFormArray.push(
          this.fb.group({
            id: [pregunta.id],
            texto_pregunta: [pregunta.texto_pregunta],
            tipo: [pregunta.tipo],
            respuesta: ['', Validators.required],
            m_opciones: [pregunta.m_opciones],
          }) as FormGroup<any>
        );
      });

      const seccionGroup = this.fb.group({
        id: [data.id],
        titulo: [data.titulo],
        preguntas: preguntasFormArray,
      });

      seccionesFormArray.push(seccionGroup);
    });
  }

  canExitSection(index: number): boolean {
    const preguntas = this.getSeccionPreguntas(index);
    this.markAllTouched(preguntas);
    return preguntas.valid;
  }

  canEnterSection(index: number): boolean {
    return true;
  }

  markAllTouched(group: FormGroup | FormArray) {
    Object.values(group.controls).forEach(ctrl => {
      if (ctrl instanceof FormGroup || ctrl instanceof FormArray) {
        this.markAllTouched(ctrl);
      } else {
        ctrl.markAsTouched();
      }
    });
  }

  onStepEnter(direction: MovingDirection, index: number) {
  const seccion = this.seccionesArray.at(index);
  this.currentSectionTitle = seccion.get('titulo')?.value || '';
}
}
