import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { FormsModule, NgForm, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../core/interfaces/user';
import Swal from 'sweetalert2';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'app-login',
    imports: [
      RouterLink,
      FormsModule
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  returnUrl: any;
  loggedin: boolean = false;
  Urfc: string = '';
  Upassword: string = '';
  cargando = false;
  mostrarPassword = false;
  readonly anio = new Date().getFullYear();
  userRole$: Observable<string | undefined>;
  formLogin: FormGroup;

  public _userService = inject(UserService);

  constructor(private router: Router, private route: ActivatedRoute, private fb: FormBuilder) {

    this.formLogin = this.fb.group({
      Urfc: [null, Validators.required],
      Upassword: [null, Validators.required],
    },{
        validators: []
    });

  }

  ngOnInit(): void {
    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

 
  onLoggedin(form: NgForm) {
    if (form.invalid || this.cargando) {
      form.control.markAllAsTouched();
      return;
    }
    const user: User = {
      rfc: (form.value.Urfc || '').trim().toUpperCase(),
      password: form.value.Upassword
    };

    this.cargando = true;
    this._userService.login(user).subscribe({
      next: (response: any) => {
        this.cargando = false;
        const userData = response.user;
        const bandera = response.bandera;
        localStorage.setItem('isLoggedin', 'true'); 
        this._userService.setCurrentUser(userData);
        if (bandera) {
          this.router.navigate(['/cuestionario']);
        } else {
          this.router.navigate([this.returnUrl]);
        }
      },
      error: (e: HttpErrorResponse) => {
        this.cargando = false;
        if (e.status === 400) {
          Swal.fire({
            position: "center",
            icon: "error",
            title: "Usuario no existe.",
            showConfirmButton: false,
            timer: 3000
          });
        } else if (e.status === 402) {
          Swal.fire({
            position: "center",
            icon: "error",
            title: "Contraseña incorrecta.",
            showConfirmButton: false,
            timer: 3000
          });
        } else {
          console.error('Error desconocido:', e);
          Swal.fire({
            position: "center",
            icon: "error",
            title: "No pudimos iniciar sesión.",
            text: "Revisa tu conexión e inténtalo de nuevo.",
            showConfirmButton: false,
            timer: 3000
          });
        }
      },
    });

    // console.log(user);
    
  }

}
