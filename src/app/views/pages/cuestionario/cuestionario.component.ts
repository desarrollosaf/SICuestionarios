import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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

  ngAfterViewInit() { }

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
        const isCheckbox =
          (seccionIndex === 1 && preguntaIndex === 4) ||
          (seccionIndex === 5 && preguntaIndex === 1);

        let respuestaControl;

        if (isCheckbox) {
     
          respuestaControl = this.fb.array([]);

   
          const hasOtroOption = pregunta.m_opciones.some((o: any) =>
            o.texto_opcion.toLowerCase() === 'otro'
          );

          preguntasFormArray.push(
            this.fb.group({
              id: [pregunta.id],
              texto_pregunta: [pregunta.texto_pregunta],
              respuesta: respuestaControl,
              otroValor: [''],  // control para input "Otro"
              m_opciones: [pregunta.m_opciones],
              isCheckbox: [isCheckbox],
              hasOtroOption: [hasOtroOption],
            })
          );

        } else {
          respuestaControl = this.fb.control('', Validators.required);
          preguntasFormArray.push(
            this.fb.group({
              id: [pregunta.id],
              texto_pregunta: [pregunta.texto_pregunta],
              respuesta: respuestaControl,
              m_opciones: [pregunta.m_opciones],
              isCheckbox: [isCheckbox],
            })
          );
        }
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
    const preguntaGroup = this.getSeccionPreguntas(seccionIndex).at(preguntaIndex) as FormGroup;
    const respuestas: FormArray = preguntaGroup.get('respuesta') as FormArray;

    const value = event.target.value;
    const checked = event.target.checked;

    if (checked) {
      respuestas.push(new FormControl(value));
    } else {
      const index = respuestas.controls.findIndex((x) => x.value === value);
      if (index !== -1) {
        respuestas.removeAt(index);
      }
    }

    // Validación para el input "Otro"
    const hasOtroOption = preguntaGroup.get('hasOtroOption')?.value;
    if (hasOtroOption) {
      const otroOpcion = preguntaGroup.get('m_opciones')?.value.find((o: any) => o.texto_opcion.toLowerCase() === 'Otro');

      if (otroOpcion && otroOpcion.id === value) {
        const otroValorControl = preguntaGroup.get('otroValor') as FormControl;
        if (checked) {
          
          otroValorControl.setValidators([Validators.required]);
        } else {
          
          otroValorControl.setValue('');
          otroValorControl.clearValidators();
        }
        otroValorControl.updateValueAndValidity();
      }
    }
  }

  isOtroSelected(preguntaControl: AbstractControl): boolean {
    const pregunta = preguntaControl as FormGroup;
    const respuesta = pregunta.get('respuesta')?.value as any[];
    const opciones = pregunta.get('m_opciones')?.value as any[];
    if (!respuesta || !opciones) return false;

    const otroOpcion = opciones.find(o => o.texto_opcion.toLowerCase() === 'otro');
    if (!otroOpcion) return false;

    return respuesta.includes(otroOpcion.id);
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

  submitCuestionario() {
    if (this.formCuestionario.invalid) {
      this.markAllTouched(this.formCuestionario);
      return;
    }

    
    const resultado = this.seccionesArray.controls.map((seccionGroup) => {
      const preguntas = seccionGroup.get('preguntas') as FormArray;
      return preguntas.controls.map((preguntaGroup) => {
        const respuesta = preguntaGroup.get('respuesta')?.value;
        const otroValor = preguntaGroup.get('otroValor')?.value;

        return {
          idPregunta: preguntaGroup.get('id')?.value,
          respuesta,
          otroValor: otroValor || null,
        };
      });
    });

    console.log('Datos para enviar:', resultado);
    
  }
}
