import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class CommentsService {
  private _HttpClient = inject(HttpClient)
  private _CookieService = inject(CookieService)


  GetPostComments(postId: string): Observable<any> {
    return this._HttpClient.get(`${environment.baseURL}/posts/${postId}/comments?page=1&limit=10`)
  }

  CreateComment(commentData: FormData, postId: string): Observable<any> {
    return this._HttpClient.post(`${environment.baseURL}/posts/${postId}/comments`, commentData)
  }
}
