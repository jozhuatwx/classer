import { Component, HostListener } from '@angular/core';
import { MatDrawerMode } from '@angular/material/sidenav';

import { UserApiService } from 'src/app/services/user/user-api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  // sidenav options
  mode: MatDrawerMode = 'over';

  // menu links
  links = [
    { name: 'Session', path: '/sessions', icon: 'dashboard' },
    { name: 'User', path: '/users/update', icon: 'account_circle' }
  ];

  // state
  sidenavOpen = false;

  constructor(
    public userApiService: UserApiService
  ) {
    // update sidenav option
    this.resized();
    // subscribe to name change
    this.userApiService.userNameChange
      .subscribe({
        // update to 
        next: (value) => this.links[1].name = value
      });
  }

  logout(): void {
    // logout user
    this.userApiService.confirmLogout();
  }

  @HostListener('window:resize')
  resized(): void {
    // update sidenav option
    if (window.innerWidth > 550) {
      this.sidenavOpen = true;
      this.mode = 'side';
    } else {
      this.sidenavOpen = false;
      this.mode = 'over';
    }
  }
}
