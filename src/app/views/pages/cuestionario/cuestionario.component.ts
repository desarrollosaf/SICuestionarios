import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
  FormControl
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CuestionarioService } from '../../../service/cuestionario.service';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ArchwizardModule, WizardComponent } from '@rg-software/angular-archwizard';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
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
export class CuestionarioComponent implements AfterViewInit, OnInit {
  @ViewChild('wizardForm') wizardForm: WizardComponent;
  formCuestionario: FormGroup;
  currentSectionTitle = '';

  constructor(private fb: FormBuilder, private _cuestionarioService: CuestionarioService) {
    this.formCuestionario = this.fb.group({
      secciones: this.fb.array([]),
    });
  }

  ngAfterViewInit() {}

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

    secciones.forEach((data, seccionIndex) => {
      const preguntasFormArray = new FormArray<FormGroup<any>>([]);

      data.m_preguntas.forEach((pregunta: any, preguntaIndex: number) => {
        // Sección 2 (índice 1), Pregunta 5 (índice 4)
        // Sección 6 (índice 5), Pregunta 2 (índice 1)
        const isCheckbox =
          (seccionIndex === 1 && preguntaIndex === 4) ||
          (seccionIndex === 5 && preguntaIndex === 1);

        let respuestaControl;

        if (isCheckbox) {
          // Checkbox y opcional
          respuestaControl = this.fb.array([]);
        } else {
          // Radio obligatorio
          respuestaControl = this.fb.control('', Validators.required);
        }

        preguntasFormArray.push(
          this.fb.group({
            id: [pregunta.id],
            texto_pregunta: [pregunta.texto_pregunta],
            respuesta: respuestaControl,
            m_opciones: [pregunta.m_opciones],
            isCheckbox: [isCheckbox],
          })
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

  onCheckboxChange(event: any, preguntaIndex: number, seccionIndex: number) {
    const respuestas: FormArray = this.getSeccionPreguntas(seccionIndex)
      .at(preguntaIndex)
      .get('respuesta') as FormArray;

    if (event.target.checked) {
      respuestas.push(new FormControl(event.target.value));
    } else {
      const index = respuestas.controls.findIndex(
        (x) => x.value === event.target.value
      );
      if (index !== -1) {
        respuestas.removeAt(index);
      }
    }
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
    Object.values(group.controls).forEach((ctrl) => {
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
