import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class UserService {

  private _HttpClient = inject(HttpClient)
  private _CookieService = inject(CookieService)
  private _Router = inject(Router)


  LogOut() {
    this._CookieService.delete('token');
    this._Router.navigate(['/login'])
  }


  GetFollowSuggestions(): Observable<any> {
    return this._HttpClient.get(`${environment.baseURL}/users/suggestions?limit=10`)
  }

  GetMyProfile(): Observable<any> {
    return this._HttpClient.get(`${environment.baseURL}/users/profile-data`)
  }

  UpdateProfileImage(img: FormData): Observable<any> {
    return this._HttpClient.put(`${environment.baseURL}/users/upload-photo`, img)
  }

  GetBookmarks(): Observable<any> {
    return this._HttpClient.get(`${environment.baseURL}/users/bookmarks`)
  }

  FollowOrUnFollowUser(userId: string): Observable<any> {
    return this._HttpClient.post(`${environment.baseURL}/users/${userId}/follow`, {})
  }


}
