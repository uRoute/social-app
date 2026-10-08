import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';
import { ILogged } from '../../../core/models/LoggedUser/ilogged.interface';
import { jwtDecode } from "jwt-decode";

@Injectable({
  providedIn: 'root',
})
export class UserService {

  private _HttpClient = inject(HttpClient)
  private _CookieService = inject(CookieService)
  private _Router = inject(Router)
  userInfo: WritableSignal<ILogged | null> = signal<ILogged | null>(null);

  constructor() {
    const savedUser = this._CookieService.get('userInfo');
    if (savedUser) {
      try {
        this.userInfo.set(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse userInfo cookie', e);
      }
    }
  }


  LogOut() {
    this._CookieService.delete('token');
    this._Router.navigate(['/login']);
    this.userInfo.set(null);
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
    return this._HttpClient.put(`${environment.baseURL}/users/${userId}/follow`, '')
  }

  GetUserProfile(userId: string): Observable<any> {
    return this._HttpClient.get(`${environment.baseURL}/users/${userId}/profile`)
  }

  GetUserPosts(userId: string): Observable<any> {
    return this._HttpClient.get(`${environment.baseURL}/users/${userId}/posts`)
  }

  ChangePassword(data: object): Observable<any> {
    return this._HttpClient.patch(`${environment.baseURL}/users/change-password`, data)
  }


}
