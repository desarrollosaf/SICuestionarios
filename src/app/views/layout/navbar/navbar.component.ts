import { Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

import { MENU } from './menu';
import { MenuItem } from './menu.model';
import { FeatherIconDirective } from '../../../core/feather-icon/feather-icon.directive';
import { UserService } from '../../../core/services/user.service';

@Component({
    selector: 'app-navbar',
    imports: [
        NgbDropdownModule,
        FeatherIconDirective,
        RouterLink,
        RouterLinkActive,
    ],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {

  menuItems: MenuItem[] = [];
  menuAbierto = false;
  rfc = '';
  nombre = '';
  esAdmin = false;

  constructor(
    private router: Router,
    private _userService: UserService
  ) {}

  ngOnInit(): void {
    const usuario = this._userService.currentUserValue;
    this.rfc = usuario?.rfc ?? '';
    this.nombre = this.formatearNombre(usuario?.nombre);

    // Sesiones iniciadas antes de que el login regresara el nombre: se pide al back
    if (usuario && !usuario.nombre) {
      this._userService.getCurrentUser().subscribe({
        next: (me) => {
          if (!me?.nombre) return;
          // Se guarda sólo lo necesario; las sesiones viejas traían el hash de la contraseña
          this._userService.setCurrentUser({
            rfc: me.rfc || usuario.rfc,
            nombre: me.nombre,
            email: usuario.email ?? null,
          });
          this.nombre = this.formatearNombre(me.nombre);
        },
        error: () => {},
      });
    }
    this.esAdmin = this.rfc.startsWith('GEN25');
    const role = this.esAdmin ? 'GEN25' : 'usuario';

    this.menuItems = this.filterMenuByRole(MENU, role);

    // Cierra el menú móvil después de navegar
    this.router.events.forEach((event) => {
      if (event instanceof NavigationEnd) {
        this.menuAbierto = false;
      }
    });
  }

  get iniciales(): string {
    if (this.nombre) {
      return this.nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
    }
    return this.rfc.replace(/^GEN25/, '').slice(0, 2).toUpperCase() || 'U';
  }

  // "DESALES GARCÍA CESAR" -> "Desales García Cesar"
  private formatearNombre(nombre?: string | null): string {
    return (nombre ?? '')
      .trim()
      .toLocaleLowerCase('es-MX')
      .split(/\s+/)
      .filter(Boolean)
      .map(p => ['de', 'del', 'la', 'las', 'los', 'y'].includes(p) ? p : p.charAt(0).toLocaleUpperCase('es-MX') + p.slice(1))
      .join(' ');
  }

  private filterMenuByRole(menu: MenuItem[], role: string): MenuItem[] {
    return menu
      .filter(item => {
        return !item.roles || item.roles.includes(role);
      })
      .map(item => ({
        ...item,
        subMenus: item.subMenus?.map(sub => ({
          ...sub,
          subMenuItems: (sub.subMenuItems ?? []).filter(subItem =>
            !subItem.roles || subItem.roles.includes(role)
          )
        }))
    }));
  }

  /**
   * Logout
   */
  onLogout(e: Event) {
    e.preventDefault();

    this._userService.logout().subscribe({
      next: () => {
        // Limpia cualquier dato local
        localStorage.removeItem('currentUser');
        localStorage.setItem('isLoggedin', 'false');
        this._userService.setCurrentUser(null);

        // Redirige al login
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        console.error('Error al cerrar sesión', err);
      }
    });

  }

  @HostListener('document:keydown.escape') cerrarMenu() {
    this.menuAbierto = false;
  }

  /**
   * Returns true or false depending on whether the given menu item has a child
   * @param item menuItem
   */
  hasItems(item: MenuItem) {
    return item.subMenus !== undefined ? item.subMenus.length > 0 : false;
  }

  // Marca como activo un menú con submenú cuando la ruta actual es una de sus opciones
  tieneLinkActivo(item: MenuItem): boolean {
    return (item.subMenus ?? []).some(sub =>
      (sub.subMenuItems ?? []).some(subItem =>
        !!subItem.link && this.router.isActive(subItem.link, {
          paths: 'exact', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored'
        })
      )
    );
  }

}
