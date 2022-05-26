import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { UserApiService } from 'src/app/services/user/user-api.service';
import { CreateSessionDto } from 'src/app/models/session/create-session-dto.model';
import { Session } from 'src/app/models/session/session.model';
import { UpdateSessionDto } from 'src/app/models/session/update-session-dto.model';

@Injectable({
  providedIn: 'root'
})
export class SessionApiService {

  // api url
  private readonly api = `${environment.apiUrl}/sessions`;

  constructor(
    private httpClient: HttpClient,
    private userApiService: UserApiService
  ) { }

  createSession(data: CreateSessionDto): Observable<string> {
    // create session
    return this.httpClient.post<string>(this.api, { data: data }, { headers: { 'user-id': this.userApiService.getCurrentUser().id, 'clear-cache': this.api }});
  }

  getAllSessions(): Observable<Session[] | string> {
    // get all sessions
    return this.httpClient.get<Session[] | string>(this.api, { headers: { 'user-id': this.userApiService.getCurrentUser().id }});
  }

  getSession(sessionId: string): Observable<Session | string> {
    // get session
    return this.httpClient.get<Session | string>(`${this.api}/${sessionId}`, { headers: { 'user-id': this.userApiService.getCurrentUser().id }});
  }

  updateSession(sessionId: string, data: UpdateSessionDto): Observable<string> {
    // update session
    return this.httpClient.put<string>(`${this.api}/${sessionId}`, { data: data }, { headers: { 'user-id': this.userApiService.getCurrentUser().id, 'clear-cache': `${this.api},${this.api}/${sessionId}` }});
  }

  deleteSession(sessionId: string): Observable<string> {
    // delete session
    return this.httpClient.delete<string>(`${this.api}/${sessionId}`, { headers: { 'user-id': this.userApiService.getCurrentUser().id, 'clear-cache': this.api }});
  }
}
