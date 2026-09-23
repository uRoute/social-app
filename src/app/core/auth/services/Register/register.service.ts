import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class RegisterService {
    private readonly _HttpClient = inject(HttpClient)

  SignUp(formData:object):Observable<any>{
    return this._HttpClient.post(`${environment.baseURL}/users/signup` , formData )
  }
}
