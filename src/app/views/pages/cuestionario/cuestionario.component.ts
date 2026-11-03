import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { Subscription, debounceTime } from 'rxjs';
import Swal from 'sweetalert2';
import { UserService } from '../../../core/services/user.service';
import { NombrePropioPipe } from '../../../core/pipes/nombre-propio.pipe';

@Component({
  selector: 'app-cuestionario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbCollapseModule,
    NombrePropioPipe,
  ],
  templateUrl: './cuestionario.component.html',
  styleUrls: ['./cuestionario.component.scss'],
})
export class CuestionarioComponent implements OnInit, OnDestroy {
  formCuestionario: FormGroup;
  responde: boolean = false;
  fechaRegistro: Date | null = null;
  cargando = true;
  errorCarga = false;
  enviando = false;
  errorEnvio = '';
  pasoActual = 0;
  faltantesPaso = 0;
  instruccionesColapsadas = true;
  borradorRestaurado = false;
  recienEnviado = false;
  readonly maxComentarios = 3000;
  readonly letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  readonly circunferencia = 2 * Math.PI * 20;
  // Piezas de confeti con posiciones pseudoaleatorias fijas
  readonly confeti = Array.from({ length: 28 }, (_, i) => ({
    left: (i * 37) % 100,
    delay: ((i * 13) % 10) / 10,
    duracion: 2.2 + ((i * 7) % 10) / 10,
    color: i % 4,
    giro: (i * 47) % 360,
  }));
  private readonly iconosSeccion: [string, string][] = [
    ['DATOS', 'bi-person-vcard'],
    ['SENSIBILIZ', 'bi-mortarboard'],
    ['CONDICIONES', 'bi-briefcase'],
    ['PERMANENCIA', 'bi-graph-up-arrow'],
    ['CORRESPONSABILIDAD', 'bi-house-heart'],
    ['AMBIENTE', 'bi-people'],
  ];
  // Estado de avance precalculado; se actualiza sólo cuando cambia el formulario
  estado = {
    contestadas: [] as boolean[][],
    visibles: [] as boolean[][],
    totales: [] as number[],
    respondidas: [] as number[],
    completas: [] as boolean[],
    desbloqueadas: [] as boolean[],
    totalPreguntas: 0,
    totalRespondidas: 0,
    progreso: 0,
    offsetProgreso: 0,
  };
  public _userService = inject(UserService);
  private draftSub?: Subscription;
  private formSub?: Subscription;
  private autoScrollTimer?: ReturnType<typeof setTimeout>;

  constructor(private fb: FormBuilder, private _cuestionarioService: CuestionarioService) {
    this.formCuestionario = this.fb.group({
      secciones: this.fb.array([]),
      comentarios: ['', Validators.maxLength(this.maxComentarios)]
    });
  }

  ngOnInit(): void {
    this.getPreguntas();
  }

  ngOnDestroy(): void {
    this.draftSub?.unsubscribe();
    this.formSub?.unsubscribe();
    clearTimeout(this.autoScrollTimer);
  }

  get rfc(): string {
    return this._userService.currentUserValue?.rfc ?? '';
  }

  get seccionesArray(): FormArray {
    return this.formCuestionario.get('secciones') as FormArray;
  }

  get comentariosControl(): FormControl {
    return this.formCuestionario.get('comentarios') as FormControl;
  }

  get esUltimoPaso(): boolean {
    return this.pasoActual === this.seccionesArray.length - 1;
  }

  getSeccionPreguntas(index: number): FormArray {
    return this.seccionesArray.at(index).get('preguntas') as FormArray;
  }

  getPreguntas() {
    this.cargando = true;
    this.errorCarga = false;
    this._cuestionarioService.getPreguntas(this.rfc).subscribe({
      next: (response) => {
        if (response?.status == 300) {
          this.fechaRegistro = new Date(response.fecha); // convierte a Date
          this.responde = true;
          this.borrarBorrador();
        } else {
          this.buildForm(response.data);
          this.restaurarBorrador();
          this.recalcularEstado();
          this.formSub?.unsubscribe();
          this.formSub = this.formCuestionario.valueChanges.subscribe(() => this.recalcularEstado());
          this.draftSub?.unsubscribe();
          this.draftSub = this.formCuestionario.valueChanges
            .pipe(debounceTime(400))
            .subscribe(() => this.guardarBorrador());
        }
        this.cargando = false;
      },
      error: (e: HttpErrorResponse) => {
        console.error(e);
        this.cargando = false;
        this.errorCarga = true;
      },
    });
  }

  buildForm(secciones: any[]) {
    const seccionesFormArray = this.seccionesArray;
    seccionesFormArray.clear();
    secciones.forEach((data, seccionIndex) => {
      const preguntasFormArray = new FormArray<FormGroup<any>>([]);
      data.m_preguntas.forEach((pregunta: any) => {
        // El tipo, si es obligatoria y la condición para mostrarse vienen de la base
        const isCheckbox = pregunta.tipo === 'multiple';
        const obligatoria = pregunta.obligatoria !== false && pregunta.obligatoria !== 0;
        const hasOtroOption = pregunta.m_opciones.some((o: any) => this.esOpcionOtro(o));
        let condicion: { idPregunta: string; opciones: string[] } | null = null;
        if (pregunta.id_pregunta_condicion) {
          try {
            condicion = { idPregunta: pregunta.id_pregunta_condicion, opciones: JSON.parse(pregunta.opciones_condicion || '[]') };
          } catch {
            condicion = null;
          }
        }

        let respuesta: AbstractControl;
        if (isCheckbox) {
          respuesta = this.fb.array([], obligatoria ? Validators.required : null);
        } else {
          respuesta = this.fb.control('', obligatoria ? Validators.required : null);
        }

        preguntasFormArray.push(
          this.fb.group({
            id: [pregunta.id],
            texto_pregunta: [pregunta.texto_pregunta],
            respuesta,
            otroValor: [''],
            m_opciones: [pregunta.m_opciones],
            isCheckbox: [isCheckbox],
            hasOtroOption: [hasOtroOption],
            obligatoria: [obligatoria],
            condicion: [condicion],
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

  // ---------- Respuestas ----------

  private esOpcionOtro(opcion: any): boolean {
    return /^otr[oa]$/i.test((opcion?.texto_opcion || '').trim());
  }

  // El campo "especifica" es obligatorio sólo mientras "Otro"/"Otra" esté elegido
  private sincronizarOtro(preguntaGroup: FormGroup) {
    if (!preguntaGroup.get('hasOtroOption')?.value) return;
    const otroValorControl = preguntaGroup.get('otroValor') as FormControl;
    if (this.isOtroSelected(preguntaGroup)) {
      otroValorControl.setValidators([Validators.required]);
    } else {
      otroValorControl.setValue('', { emitEvent: false });
      otroValorControl.clearValidators();
    }
    otroValorControl.updateValueAndValidity();
  }

  onRadioChange(seccionIndex: number, preguntaIndex: number) {
    this.sincronizarOtro(this.getSeccionPreguntas(seccionIndex).at(preguntaIndex) as FormGroup);
    this.actualizarFaltantes();
    // Lleva al usuario a la siguiente pregunta sin responder de la sección
    clearTimeout(this.autoScrollTimer);
    this.autoScrollTimer = setTimeout(() => this.irASiguienteSinResponder(seccionIndex, preguntaIndex), 300);
  }

  onCheckboxChange(event: any, preguntaIndex: number, seccionIndex: number) {
    const preguntaGroup = this.getSeccionPreguntas(seccionIndex).at(preguntaIndex) as FormGroup;
    const value = event.target.value;
    const checked = event.target.checked;
    this.toggleCheckbox(preguntaGroup, value, checked);
    this.actualizarFaltantes();
  }

  private toggleCheckbox(preguntaGroup: FormGroup, value: string, checked: boolean) {
    const respuestas: FormArray = preguntaGroup.get('respuesta') as FormArray;

    if (checked) {
      respuestas.push(new FormControl(value));
    } else {
      const index = respuestas.controls.findIndex((x) => x.value === value);
      if (index !== -1) {
        respuestas.removeAt(index);
      }
    }

    this.sincronizarOtro(preguntaGroup);
  }

  isOtroSelected(preguntaControl: AbstractControl): boolean {
    const pregunta = preguntaControl as FormGroup;
    const respuesta = pregunta.get('respuesta')?.value;
    const opciones = pregunta.get('m_opciones')?.value as any[];
    if (!respuesta || !opciones) return false;
    const otroOpcion = opciones.find(o => this.esOpcionOtro(o));
    if (!otroOpcion) return false;
    return Array.isArray(respuesta) ? respuesta.includes(otroOpcion.id) : respuesta === otroOpcion.id;
  }

  isSelected(pregunta: AbstractControl, opcionId: string): boolean {
    const respuesta = pregunta.get('respuesta')?.value;
    return Array.isArray(respuesta) ? respuesta.includes(opcionId) : respuesta === opcionId;
  }

  isAnswered(pregunta: AbstractControl): boolean {
    const respuesta = pregunta.get('respuesta')?.value;
    if (Array.isArray(respuesta)) {
      return respuesta.length > 0 && !pregunta.get('otroValor')?.invalid;
    }
    return !!respuesta;
  }

  hasError(pregunta: AbstractControl): boolean {
    return (!!pregunta.get('respuesta')?.invalid && !!pregunta.get('respuesta')?.touched) ||
      (!!pregunta.get('otroValor')?.invalid && !!pregunta.get('otroValor')?.touched);
  }

  // ---------- Progreso ----------

  // Una pregunta condicional se muestra sólo si en su pregunta "padre" se eligió alguna opción activadora
  private esVisible(pregunta: AbstractControl, porId: Map<string, AbstractControl>): boolean {
    const condicion = pregunta.get('condicion')?.value as { idPregunta: string; opciones: string[] } | null;
    if (!condicion) return true;
    const padre = porId.get(condicion.idPregunta);
    if (!padre) return true;
    const valor = padre.get('respuesta')?.value;
    const elegidas: string[] = Array.isArray(valor) ? valor : valor ? [valor] : [];
    return elegidas.some(v => condicion.opciones.includes(v));
  }

  // Al ocultarse una pregunta condicional se borra lo que tenía, para no enviar respuestas que ya no aplican
  private limpiarPregunta(pregunta: AbstractControl) {
    const respuesta = pregunta.get('respuesta');
    if (respuesta instanceof FormArray) {
      if (respuesta.length) respuesta.clear({ emitEvent: false });
    } else if (respuesta?.value) {
      respuesta.setValue('', { emitEvent: false });
    }
    const otro = pregunta.get('otroValor');
    if (otro?.value || otro?.validator) {
      otro.setValue('', { emitEvent: false });
      otro.clearValidators();
      otro.updateValueAndValidity({ emitEvent: false });
    }
    respuesta?.markAsUntouched();
    respuesta?.updateValueAndValidity({ emitEvent: false });
  }

  private recalcularEstado() {
    const porId = new Map<string, AbstractControl>();
    this.seccionesArray.controls.forEach((_, i) =>
      this.getSeccionPreguntas(i).controls.forEach(p => porId.set(p.get('id')?.value, p))
    );

    const visibles = this.seccionesArray.controls.map((_, i) =>
      this.getSeccionPreguntas(i).controls.map(p => {
        const visible = this.esVisible(p, porId);
        if (!visible) this.limpiarPregunta(p);
        return visible;
      })
    );
    const contestadas = this.seccionesArray.controls.map((_, i) =>
      this.getSeccionPreguntas(i).controls.map(p => this.isAnswered(p))
    );
    // El avance cuenta sólo preguntas obligatorias visibles
    const cuentan = this.seccionesArray.controls.map((_, i) =>
      this.getSeccionPreguntas(i).controls.map((p, j) => visibles[i][j] && !!p.get('obligatoria')?.value)
    );
    const totales = cuentan.map(s => s.filter(Boolean).length);
    const respondidas = cuentan.map((s, i) => s.filter((c, j) => c && contestadas[i][j]).length);
    const completas = totales.map((t, i) => this.getSeccionPreguntas(i).valid && respondidas[i] === t);
    const desbloqueadas: boolean[] = [];
    let libre = true;
    this.seccionesArray.controls.forEach((_, i) => {
      desbloqueadas.push(libre);
      libre = libre && this.getSeccionPreguntas(i).valid;
    });
    const totalPreguntas = totales.reduce((acc, n) => acc + n, 0);
    const totalRespondidas = respondidas.reduce((acc, n) => acc + n, 0);
    const progreso = totalPreguntas ? Math.round((totalRespondidas / totalPreguntas) * 100) : 0;
    this.estado = {
      contestadas,
      visibles,
      totales,
      respondidas,
      completas,
      desbloqueadas,
      totalPreguntas,
      totalRespondidas,
      progreso,
      offsetProgreso: this.circunferencia * (1 - progreso / 100),
    };
  }

  // Total de preguntas del cuestionario (incluye opcionales y condicionales)
  get cantidadPreguntas(): number {
    return this.seccionesArray.controls.reduce((acc, _, i) => acc + this.getSeccionPreguntas(i).length, 0);
  }

  totalSeccion(index: number): number {
    return this.estado.totales[index] ?? 0;
  }

  respondidasSeccion(index: number): number {
    return this.estado.respondidas[index] ?? 0;
  }

  get totalPreguntas(): number {
    return this.estado.totalPreguntas;
  }

  get totalRespondidas(): number {
    return this.estado.totalRespondidas;
  }

  get progreso(): number {
    return this.estado.progreso;
  }

  get offsetProgreso(): number {
    return this.estado.offsetProgreso;
  }

  iconoSeccion(titulo: string): string {
    const t = (titulo || '').toUpperCase();
    return this.iconosSeccion.find(([clave]) => t.includes(clave))?.[1] ?? 'bi-ui-checks';
  }

  seccionCompleta(index: number): boolean {
    return !!this.estado.completas[index];
  }

  private actualizarFaltantes() {
    if (this.faltantesPaso > 0) {
      const preguntas = this.getSeccionPreguntas(this.pasoActual);
      this.faltantesPaso = preguntas.controls.filter(p => p.invalid).length;
    }
  }

  // ---------- Navegación ----------

  siguiente() {
    if (!this.validarPaso(this.pasoActual)) return;
    this.irAPaso(this.pasoActual + 1);
  }

  anterior() {
    if (this.pasoActual > 0) this.irAPaso(this.pasoActual - 1);
  }

  // Desde el stepper: se puede regresar libremente, pero para avanzar
  // todas las secciones previas deben estar completas
  seleccionarPaso(index: number) {
    if (index === this.pasoActual) return;
    if (index < this.pasoActual) {
      this.irAPaso(index);
      return;
    }
    for (let i = this.pasoActual; i < index; i++) {
      if (!this.validarPaso(i)) {
        if (i !== this.pasoActual) this.irAPaso(i, false);
        return;
      }
    }
    this.irAPaso(index);
  }

  puedeIrA(index: number): boolean {
    return !!this.estado.desbloqueadas[index];
  }

  private validarPaso(index: number): boolean {
    const preguntas = this.getSeccionPreguntas(index);
    if (preguntas.valid) {
      this.faltantesPaso = 0;
      return true;
    }
    this.markAllTouched(preguntas);
    this.faltantesPaso = preguntas.controls.filter(p => p.invalid).length;
    const primera = preguntas.controls.findIndex(p => p.invalid);
    setTimeout(() => this.scrollTo(`q-${index}-${primera}`), 50);
    return false;
  }

  private irAPaso(index: number, limpiarAviso = true) {
    this.pasoActual = index;
    if (limpiarAviso) this.faltantesPaso = 0;
    this.guardarBorrador();
    setTimeout(() => this.scrollTo('cuestionario-top', 'start'), 0);
  }

  private irASiguienteSinResponder(seccionIndex: number, desde: number) {
    const contestadas = this.estado.contestadas[seccionIndex] ?? [];
    const visibles = this.estado.visibles[seccionIndex] ?? [];
    const siguiente = contestadas.findIndex((c, idx) => idx > desde && visibles[idx] && !c);
    if (siguiente !== -1) {
      this.scrollSiFueraDeVista(`q-${seccionIndex}-${siguiente}`);
    } else if (this.seccionCompleta(seccionIndex)) {
      this.scrollSiFueraDeVista('acciones-paso');
    }
  }

  // Sólo desplaza si el elemento no está ya completo en pantalla, para no pelear con el scroll del usuario
  private scrollSiFueraDeVista(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const visible = rect.top >= 140 && rect.bottom <= window.innerHeight - 16;
    if (!visible) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private scrollTo(id: string, block: ScrollLogicalPosition = 'center') {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block });
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

  // ---------- Borrador local ----------

  private get draftKey(): string {
    return `cuestionario-borrador-${this.rfc}`;
  }

  private guardarBorrador() {
    try {
      const respuestas: Record<string, { respuesta: any; otroValor?: string }> = {};
      this.seccionesArray.controls.forEach((_, i) => {
        this.getSeccionPreguntas(i).controls.forEach(p => {
          respuestas[p.get('id')?.value] = {
            respuesta: p.get('respuesta')?.value,
            otroValor: p.get('otroValor')?.value,
          };
        });
      });
      localStorage.setItem(this.draftKey, JSON.stringify({
        respuestas,
        comentarios: this.comentariosControl.value,
        paso: this.pasoActual,
      }));
    } catch { }
  }

  private restaurarBorrador() {
    let borrador: any = null;
    try {
      borrador = JSON.parse(localStorage.getItem(this.draftKey) || 'null');
    } catch { }
    if (!borrador?.respuestas) return;

    let restauradas = 0;
    this.seccionesArray.controls.forEach((_, i) => {
      this.getSeccionPreguntas(i).controls.forEach(p => {
        const guardada = borrador.respuestas[p.get('id')?.value];
        if (!guardada?.respuesta || (Array.isArray(guardada.respuesta) && !guardada.respuesta.length)) return;
        const opciones = (p.get('m_opciones')?.value as any[]).map(o => o.id);
        if (Array.isArray(guardada.respuesta)) {
          guardada.respuesta
            .filter((id: string) => opciones.includes(id))
            .forEach((id: string) => this.toggleCheckbox(p as FormGroup, id, true));
          p.get('otroValor')?.setValue(guardada.otroValor || '');
        } else if (opciones.includes(guardada.respuesta)) {
          p.get('respuesta')?.setValue(guardada.respuesta);
          this.sincronizarOtro(p as FormGroup);
          if (this.isOtroSelected(p)) p.get('otroValor')?.setValue(guardada.otroValor || '');
        }
        restauradas++;
      });
    });
    this.comentariosControl.setValue(borrador.comentarios || '');

    // Retoma en la primera sección incompleta, sin pasar de donde se quedó
    const primeraIncompleta = this.seccionesArray.controls.findIndex((_, i) => this.getSeccionPreguntas(i).invalid);
    const paso = Number(borrador.paso) || 0;
    this.pasoActual = Math.min(paso, primeraIncompleta === -1 ? paso : primeraIncompleta, this.seccionesArray.length - 1);
    this.borradorRestaurado = restauradas > 0;
  }

  private borrarBorrador() {
    try {
      localStorage.removeItem(this.draftKey);
    } catch { }
  }

  // ---------- Envío ----------

  async submitCuestionario() {
    if (this.enviando) return;
    const incompleta = this.seccionesArray.controls.findIndex((_, i) => this.getSeccionPreguntas(i).invalid);
    if (incompleta !== -1) {
      if (incompleta !== this.pasoActual) this.irAPaso(incompleta, false);
      this.validarPaso(incompleta);
      return;
    }

    const confirmacion = await Swal.fire({
      title: '¿Enviar tus respuestas?',
      text: 'Una vez enviadas ya no podrás modificarlas.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Revisar de nuevo',
      reverseButtons: true,
    });
    if (!confirmacion.isConfirmed) return;

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
    const comentarios = this.formCuestionario.get('comentarios')?.value || '';
    const data = {
      'resultados': resultado,
      'comentarios': comentarios
    }
    this.enviando = true;
    this.errorEnvio = '';
    this._cuestionarioService.savePreg(data, this.rfc).subscribe({
      next: () => {
        this.enviando = false;
        this.draftSub?.unsubscribe();
        this.borrarBorrador();
        this.recienEnviado = true;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.getPreguntas();
      },
      error: (e: HttpErrorResponse) => {
        console.error(e);
        this.enviando = false;
        if (e.status === 400 && e.error?.msg) {
          this.errorEnvio = `${e.error.msg} Corrígelo e inténtalo de nuevo; tus respuestas siguen guardadas.`;
        } else if (e.status === 0) {
          this.errorEnvio = 'No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo; tus respuestas siguen guardadas.';
        } else {
          this.errorEnvio = 'Ocurrió un problema al guardar tus respuestas. Inténtalo de nuevo en un momento; tus respuestas siguen guardadas.';
        }
      },
    });
  }

  getPreguntaGlobalIndexDesdeSeccion2(seccionIndex: number, preguntaIndex: number): number {
    if (seccionIndex < 1) return -1;
    let total = 0;
    for (let i = 1; i < seccionIndex; i++) {
      const preguntas = (this.seccionesArray.at(i) as FormGroup).get('preguntas') as FormArray;
      total += preguntas.length;
    }
    return total + preguntaIndex + 1;
  }

  get numeroComentarios(): number {
    const ultima = this.seccionesArray.length - 1;
    return this.getPreguntaGlobalIndexDesdeSeccion2(ultima, this.getSeccionPreguntas(ultima).length - 1) + 1;
  }
}
