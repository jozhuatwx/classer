import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SessionDetailsComponent } from 'src/app/pages/sessions/session-details/session-details.component';
import { SessionsComponent } from 'src/app/pages/sessions/sessions.component';
import { LoginUserComponent } from 'src/app/pages/user/login-user/login-user.component';
import { UpdateUserComponent } from 'src/app/pages/user/update-user/update-user.component';

import { LoginGuardService } from 'src/app/services/login-guard/login-guard.service';
import { LogoutGuardService } from 'src/app/services/logout-guard/logout-guard.service';
import { CanDeactivateGuardService } from 'src/app/services/can-deactivate-guard/can-deactivate-guard.service';

const routes: Routes = [
  {
    path: 'sessions',
    // only logged in users can access pages
    canActivate: [ LoginGuardService ],
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: SessionsComponent
      },
      {
        // set id of session
        path: ':id',
        component: SessionDetailsComponent,
        // check if can deactivate component
        canDeactivate: [ CanDeactivateGuardService ]
      }
    ]
  },
  {
    path: 'users',
    children: [
      {
        path: 'login',
        component: LoginUserComponent,
        // only non-logged in users can access page
        canActivate: [ LogoutGuardService ]
      },
      {
        path: 'update',
        component: UpdateUserComponent,
        // only logged in users can access page
        canActivate: [ LoginGuardService ],
        // check if can deactivate component
        canDeactivate: [ CanDeactivateGuardService ]
      }
    ]
  },
  {
    // redirect unsupported links to sessions page
    path: '**',
    redirectTo: 'sessions'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
