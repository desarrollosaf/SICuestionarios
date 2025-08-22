// user-access.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';


@Injectable({
  providedIn: 'root'
})
export class UserAccessGuard implements CanActivate, CanActivateChild {

  constructor(private userService: UserService, private router: Router) {}

  canActivate(): boolean {
    const allowedRfcs = [
      'GEN25SAGM990220',
      'GEN25DEGC941209',
      'GEN25JISP980721'
    ];

    const userRfc = this.userService.getUserRfc()?.toUpperCase(); // por si viene en minúsculas

    if (userRfc && allowedRfcs.includes(userRfc)) {
      return true;
    }

    this.router.navigate(['/not-authorized']);
    return false;
  }

  canActivateChild(): boolean {
    return this.canActivate();
  }
}
