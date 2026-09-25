import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class UserService {

  private _HttpClient = inject(HttpClient)
  private _CookieService = inject(CookieService)
  header: object = {
    headers: {
      AUTHORIZATION: `Bearer ${this._CookieService.get('token')}`,
    }
  }

  GetFollowSuggestions():Observable<any>{
    return this._HttpClient.get(`${environment.baseURL}/users/suggestions?limit=10` , this.header)
  }

}
