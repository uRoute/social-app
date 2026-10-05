import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class CommentsService {
  private _HttpClient = inject(HttpClient)

  GetPostComments(postId: string): Observable<any> {
    return this._HttpClient.get(`${environment.baseURL}/posts/${postId}/comments?page=1&limit=10`)
  }

  CreateComment(commentData: FormData, postId: string): Observable<any> {
    return this._HttpClient.post(`${environment.baseURL}/posts/${postId}/comments`, commentData)
  }

  GetCommentReplies(commentId: string, postId: string): Observable<any> {
    return this._HttpClient.get(`${environment.baseURL}/posts/${postId}/comments/${commentId}/replies?page=1&limit=10`)
  }

  CreateCommentReply(replyData: FormData, commentId: string, postId: string): Observable<any> {
    return this._HttpClient.post(`${environment.baseURL}/posts/${postId}/comments/${commentId}/replies`, replyData)
  }

  LikeOrDislikeComment(commentId: string, postId: string): Observable<any> {
    return this._HttpClient.post(`${environment.baseURL}/posts/${postId}/comments/${commentId}/like`, {})
  }

  UpdateComment(commentData: FormData, commentId: string, postId: string): Observable<any> {
    return this._HttpClient.put(`${environment.baseURL}/posts/${postId}/comments/${commentId}`, commentData)
  }

  DeleteComment(commentId: string, postId: string): Observable<any> {
    return this._HttpClient.delete(`${environment.baseURL}/posts/${postId}/comments/${commentId}`)
  }



}
