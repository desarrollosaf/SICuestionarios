import { Component, ElementRef, inject, QueryList, ViewChildren, ViewChild, TemplateRef,OnInit } from '@angular/core';
import { FormArray, FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms'
import { CommonModule,NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { ArchwizardModule } from '@rg-software/angular-archwizard';
import { WizardComponent as BaseWizardComponent } from '@rg-software/angular-archwizard';


@Component({
  selector: 'app-cuestionario',
  imports: [CommonModule, ReactiveFormsModule,RouterLink,NgbAccordionModule, ArchwizardModule, ],
  templateUrl: './cuestionario.component.html',
  styleUrl: './cuestionario.component.scss'
})


export class CuestionarioComponent {
    validationForm1: UntypedFormGroup;
  validationForm2: UntypedFormGroup;
  validationForm3: UntypedFormGroup;
  validationForm4: UntypedFormGroup;
  validationForm5: UntypedFormGroup;
  validationForm6: UntypedFormGroup;

  isForm1Submitted: Boolean;
  isForm2Submitted: Boolean;
  isForm3Submitted: Boolean;
  isForm4Submitted: Boolean;
  isForm5Submitted: Boolean;
  isForm6Submitted: Boolean;

@ViewChild('wizardForm') wizardForm: BaseWizardComponent;
  constructor() {
  }
  ngOnInit(): void {}



}
