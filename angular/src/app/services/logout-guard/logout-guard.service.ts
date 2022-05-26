import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { UserApiService } from 'src/app/services/user/user-api.service';

@Injectable({
  providedIn: 'root'
})
export class LogoutGuardService implements CanActivate {

  constructor(
    private userApiService: UserApiService,
    private router: Router
  ) { }

  canActivate(): boolean {
    if (this.userApiService.isAuthenticated()) {
      // redirect user to main page if authenticated
      this.router.navigateByUrl('/');
      return false;
    }
    return true;
  }
}
