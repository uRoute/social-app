import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment.development';
import { IPost } from '../../../models/Post/ipost.interface';

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  private _HttpClient = inject(HttpClient)
  private _CookieService = inject(CookieService)

  posts: WritableSignal<IPost[]> = signal<IPost[]>([])

  header: object = {
    headers: {
      AUTHORIZATION: `Bearer ${this._CookieService.get('token')}`,
    }
  }

  LoadBasedOnTabPost(tab: string) {
    if (tab == 'community') {
      this.GetAllPosts().subscribe({
        next: (res) => {
          this.posts.set(res?.data.posts)
        },
        error: (err) => {
          console.log(err);
        }
      });
    } else if (tab == 'feed') {
      this.GetAllPosts(true).subscribe({
        next: (res) => {
          this.posts.set(res?.data.posts)
        },
        error: (err) => {
          console.log(err);
        }
      });
    }
    else {
      this.GetAllPosts().subscribe({
        next: (res) => {
          this.posts.set(res?.data.posts)
        },
        error: (err) => {
          console.log(err);
        }
      });
    }

  }


  GetAllPosts(following?: boolean): Observable<any> {
    return following ? this._HttpClient.get(`${environment.baseURL}/posts/feed?only=following`, this.header)
      : this._HttpClient.get(`${environment.baseURL}/posts`, this.header)
  }
  GetSinglePost(postId: string): Observable<any> {
    return this._HttpClient.get(`${environment.baseURL}/posts/${postId}`, this.header)
  }
  GetPostLikes(postId: string): Observable<any> {
    return this._HttpClient.get(`${environment.baseURL}/posts/${postId}`, this.header)
  }
  LikePost(postId: string): Observable<any> {
    return this._HttpClient.put(`${environment.baseURL}/posts/${postId}/like`, '', this.header)
  }
  SharePost(postId: string): Observable<any> {
    return this._HttpClient.post(`${environment.baseURL}/posts/${postId}/share`, '', this.header)
  }
  CreatePost(postData: object): Observable<any> {
    return this._HttpClient.post(`${environment.baseURL}/posts`, postData, this.header)
  }
  UpdatePost(postId: string): Observable<any> {
    return this._HttpClient.put(`${environment.baseURL}/posts/${postId}`, this.header)
  }
  DeletePost(postId: string): Observable<any> {
    return this._HttpClient.delete(`${environment.baseURL}/posts/${postId}`, this.header)
  }
  BookmarkPosts(postId: string): Observable<any> {
    return this._HttpClient.put(`${environment.baseURL}/posts/${postId}/bookmark`, '', this.header)
  }
}
