import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { UserApiService } from 'src/app/services/user/user-api.service';
import { CreateSnapshotDto } from 'src/app/models/snapshot/create-snapshot-dto.model';
import { Snapshot } from 'src/app/models/snapshot/snapshot.model';

@Injectable({
  providedIn: 'root'
})
export class SnapshotApiService {

  // api url
  private readonly api = `${environment.apiUrl}/sessions`;

  constructor(
    private httpClient: HttpClient,
    private userApiService: UserApiService
    ) { }

  createSnapshot(sessionId: string, data: CreateSnapshotDto): Observable<Snapshot | string> {
    // create snapshot
    return this.httpClient.post<Snapshot | string>(`${this.api}/${sessionId}/snapshots`, { data: data }, { headers: { 'user-id': this.userApiService.getCurrentUser().id, 'clear-cache': `${this.api}/${sessionId}/snapshots` }});
  }

  getAllSnapshots(sessionId: string): Observable<Snapshot[] | string> {
    // get all snapshots
    return this.httpClient.get<Snapshot[] | string>(`${this.api}/${sessionId}/snapshots`, { headers: { 'user-id': this.userApiService.getCurrentUser().id }});
  }
}
