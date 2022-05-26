import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { UserApiService } from 'src/app/services/user/user-api.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuardService implements CanActivate {

  constructor(
    private userApiService: UserApiService,
    private router: Router
  ) { }

  canActivate(): boolean {
    if (!this.userApiService.isAuthenticated()) {
      // redirect user to login page if not authenticated
      this.router.navigateByUrl('/users/login');
      return false;
    }
    return true;
  }
}
