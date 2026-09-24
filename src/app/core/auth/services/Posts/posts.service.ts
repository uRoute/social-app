import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  private _HttpClient = inject(HttpClient)
  private _CookieService = inject(CookieService)
  header:object = {
    header: {
      AUTHORIZATION: `Bearer${this._CookieService.get('token')}`,
    }
  }

  GetAllPosts():Observable<any>{
    return this._HttpClient.get(`${environment.baseURL}/posts` , this.header)
  }

  CreatePost(postData:object):Observable<any>{
    return this._HttpClient.post(`${environment.baseURL}/posts` , postData , this.header)
  }

  GetSinglePost(postId:string):Observable<any>{
    return this._HttpClient.get(`${environment.baseURL}/posts/${postId}` , this.header)
  }
  
  DeletePost(postId:string):Observable<any>{
    return this._HttpClient.delete(`${environment.baseURL}/posts/${postId}` , this.header)
  }

}
