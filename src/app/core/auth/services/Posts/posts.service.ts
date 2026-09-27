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

  posts: WritableSignal<IPost[]> = signal<IPost[]>([]);
  currentPage = signal<number>(1);
  hasMorePosts = signal<boolean>(true);
  isLoadingPosts = signal<boolean>(false);
  activeTab = signal<string>('community');
  readonly limit = 40;

  get header(): object {
    return {
      headers: {
        token: this._CookieService.get('token'),
        AUTHORIZATION: `Bearer ${this._CookieService.get('token')}`,
      }
    };
  }

  LoadBasedOnTabPost(tab: string) {
    const cleanTab = tab?.trim().toLowerCase() || 'community';
    this.activeTab.set(cleanTab);
    this.currentPage.set(1);
    this.hasMorePosts.set(true);
    this.isLoadingPosts.set(true);

    const following = cleanTab === 'feed';
    this.GetAllPosts(following, 1, this.limit).subscribe({
      next: (res) => {
        const fetchedPosts: IPost[] = res?.data?.posts || [];
        this.posts.set(fetchedPosts);
        this.isLoadingPosts.set(false);

        const totalPages = res?.meta?.pagination?.numberOfPages ?? res?.paginationInfo?.numberOfPages;
        if (fetchedPosts.length < this.limit || (totalPages !== undefined && 1 >= totalPages)) {
          this.hasMorePosts.set(false);
        }
      },
      error: (err) => {
        console.error('Error fetching initial posts:', err);
        this.isLoadingPosts.set(false);
      }
    });
  }

  loadNextPage(): void {
    if (this.isLoadingPosts() || !this.hasMorePosts() || this.posts().length === 0) {
      return;
    }

    this.isLoadingPosts.set(true);
    const nextPage = this.currentPage() + 1;
    const following = this.activeTab() === 'feed';

    this.GetAllPosts(following, nextPage, this.limit).subscribe({
      next: (res) => {
        const fetchedPosts: IPost[] = res?.data?.posts || [];
        if (fetchedPosts.length > 0) {
          const existingIds = new Set(this.posts().map((p) => p._id || p.id));
          const uniquePosts = fetchedPosts.filter((p) => !existingIds.has(p._id || p.id));
          if (uniquePosts.length > 0) {
            this.posts.update((prev) => [...prev, ...uniquePosts]);
          }
          this.currentPage.set(nextPage);
        }

        const totalPages = res?.meta?.pagination?.numberOfPages ?? res?.paginationInfo?.numberOfPages;
        if (fetchedPosts.length < this.limit || (totalPages !== undefined && nextPage >= totalPages)) {
          this.hasMorePosts.set(false);
        }
        this.isLoadingPosts.set(false);
      },
      error: (err) => {
        console.error('Error loading next page:', err);
        this.isLoadingPosts.set(false);
      }
    });
  }

  GetAllPosts(following?: boolean, page: number = 1, limit: number = 40): Observable<any> {
    const endpoint = following
      ? `${environment.baseURL}/posts/feed?only=following&page=${page}&limit=${limit}`
      : `${environment.baseURL}/posts?page=${page}&limit=${limit}`;
    return this._HttpClient.get(endpoint, this.header);
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
