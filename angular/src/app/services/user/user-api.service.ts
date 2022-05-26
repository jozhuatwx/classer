import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CacheInterceptorService } from 'src/app/services/cache-interceptor/cache-interceptor.service';
import { environment } from 'src/environments/environment';
import { DialogComponent } from 'src/app/components/dialog/dialog.component';
import { User } from 'src/app/models/user/user.model';
import { GetUserDto } from 'src/app/models/user/get-user-dto.model';
import { CreateUserDto } from 'src/app/models/user/create-user-dto.model';
import { UpdateUserDto } from 'src/app/models/user/update-user-dto.model';

@Injectable({
  providedIn: 'root'
})
export class UserApiService {

  // api url
  private readonly api = `${environment.apiUrl}/users`;

  // user details
  private user = new User();

  // subject to update user name
  userNameChange = new BehaviorSubject<string>('User');

  // state
  private authenticated = false;

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private cacheInterceptorService: CacheInterceptorService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    // read user from local or session storage
    const user = localStorage.getItem('classer-user') ? localStorage.getItem('classer-user') : sessionStorage.getItem('classer-user');
    if (user) {
      // set user details
      this.user = <User>JSON.parse(user);
      // update state
      this.authenticated = true;
      // set user name to update menu
      this.userNameChange.next(this.user.name);
      // verify if user details is valid
      this.verifyUserSession();
    }
  }

  isAuthenticated(): boolean {
    // return authenticated state
    return this.authenticated;
  }

  getCurrentUser(): User {
    // return user details
    return this.user;
  }

  setCurrentUserName(userName: string): void {
    // update user name
    this.user.name = userName;
    this.userNameChange.next(userName);

    if (localStorage.getItem('classer-user')) {
      // save to user details local storage
      localStorage.setItem('classer-user', JSON.stringify(this.user));
    } else {
      // save to user details session storage
      sessionStorage.setItem('classer-user', JSON.stringify(this.user));
    }
  }

  private verifyUserSession(): void {
    if (this.user) {
      // verify if user id is valid
      this.httpClient.get<boolean>(`${this.api}/verifyid`, { headers: { 'user-id': this.user.id }})
        .subscribe({
          next: (response) => {
            // logout if user id is not valid
            if (!response) {
              this.logout();
            }
          },
          error: (error: Error) => {
            // show error message
            this.snackBar.open(`Error: ${error.message}`, 'OK', { duration: 3000 });
            // logout
            this.logout();
          }
        });
    }
  }

  getUser(data: GetUserDto, stayLoggedIn: boolean): Observable<[boolean, string]> {
    // get user details
    return this.httpClient.post<User | string>(`${this.api}/login`, { data: data })
      .pipe(
        map((response) => {
          if (User.isUser(response)) {
            // set user details
            this.user = response;
            // set user name to update menu 
            this.userNameChange.next(this.user.name);
            // update state
            this.authenticated = true;
            if (stayLoggedIn) {
              // save to user details local storage
              localStorage.setItem('classer-user', JSON.stringify(this.user));
            } else {
              // save to user details temporary session storage
              sessionStorage.setItem('classer-user', JSON.stringify(this.user));
            }
            return [true, ''];
          }
          return [false, response];
        })
      );
  }

  createUser(data: CreateUserDto, stayLoggedIn: boolean): Observable<[boolean, string]> {
    // create user
    return this.httpClient.post<User | string>(`${this.api}/register`, { data: data })
      .pipe(
        map((response) => {
          if (User.isUser(response)) {
            // set user details
            this.user = response;
            // set user name to update menu 
            this.userNameChange.next(this.user.name);
            // update state
            this.authenticated = true;
            if (stayLoggedIn) {
              // save to user details local storage
              localStorage.setItem('classer-user', JSON.stringify(this.user));
            } else {
              // save to user details temporary session storage
              sessionStorage.setItem('classer-user', JSON.stringify(this.user));
            }
            return [true, ''];
          }
          return [false, response];
        })
      );
  }

  updateUser(data: UpdateUserDto): Observable<string> {
    // update user details
    return this.httpClient.put<string>(this.api, { data: data }, { headers: { 'user-id': this.user.id, 'clear-cache': this.api }});
  }

  deleteUser(): Observable<string> {
    // delete user
    return this.httpClient.delete<string>(this.api, { headers: { 'user-id': this.user.id, 'clear-cache': 'all' }})
      .pipe(
        map((response) => {
          // logout
          if (response) {
            this.logout();
          }
          return response;
        })
      );
  }

  confirmLogout(): void {
    // open a dialog to warn logging out
    this.dialog.open(DialogComponent, {
      data: {
        title: 'Logout',
        question: 'Changes made without saving will be lost. Do you confirm?'
      }
    })
      .afterClosed()
        .subscribe({
          next: (confirm) => {
            // logout when confirmed
            if (confirm) {
              this.logout();
            }
          }
        });
  }

  private logout(): void {
    // clear cache
    this.cacheInterceptorService.clearCache();
    // clear user details
    this.user = new User();
    this.userNameChange.next('User');
    // update state
    this.authenticated = false;
    // clear storage
    localStorage.removeItem('classer-user');
    sessionStorage.removeItem('classer-user');
    // redirect to login
    this.router.navigateByUrl('/users/login');
  }
}
