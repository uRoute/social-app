import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment.development';
import { IPost } from '../../../models/Post/ipost.interface';

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  private _HttpClient = inject(HttpClient)
  posts: WritableSignal<IPost[]> = signal<IPost[]>([]);
  currentPage = signal<number>(1);
  hasMorePosts = signal<boolean>(true);
  isLoadingPosts = signal<boolean>(false);
  activeTab = signal<string>('community');
  readonly limit = 40;


  savedPostIds: WritableSignal<Set<string>> = signal<Set<string>>(new Set<string>());

  constructor() {
    this.initSavedPosts();
  }

  initSavedPosts(): void {
    this._HttpClient.get<any>(`${environment.baseURL}/users/bookmarks`).subscribe({
      next: (res) => {
        const bookmarks = res?.data?.bookmarks || res?.data?.posts || [];
        const ids = bookmarks
          .map((b: any) => b._id || b.id || (typeof b === 'string' ? b : ''))
          .filter(Boolean);
        if (ids.length > 0) {
          this.savedPostIds.update((set) => {
            const next = new Set(set);
            ids.forEach((id: string) => next.add(id));
            return next;
          });
        }
      },
      error: () => {
        // Silent catch if unauthenticated
      },
    });
  }

  isPostSaved(post: IPost): boolean {
    const id = post._id || post.id;
    if (!id) return false;
    if (this.savedPostIds().has(id)) return true;
    return !!post.bookmarked;
  }

  toggleBookmarkInState(postId: string, isSaved?: boolean): void {
    this.savedPostIds.update((set) => {
      const next = new Set(set);
      const willBeSaved = isSaved !== undefined ? isSaved : !next.has(postId);
      if (willBeSaved) {
        next.add(postId);
      } else {
        next.delete(postId);
      }
      return next;
    });

    this.posts.update((prev) =>
      prev.map((p) => {
        if ((p._id || p.id) === postId) {
          return { ...p, bookmarked: this.savedPostIds().has(postId) };
        }
        return p;
      })
    );

    if (this.activeTab() === 'saved' && !this.savedPostIds().has(postId)) {
      this.posts.update((prev) => prev.filter((p) => (p._id || p.id) !== postId));
    }
  }

  removePostFromState(postId: string): void {
    this.posts.update((prev) => prev.filter((p) => (p._id || p.id) !== postId));
    this.savedPostIds.update((set) => {
      const next = new Set(set);
      next.delete(postId);
      return next;
    });
  }

  updatePostInState(postId: string, updated: Partial<IPost>): void {
    this.posts.update((prev) =>
      prev.map((p) => {
        if ((p._id || p.id) === postId) {
          const merged = { ...p, ...updated };
          if (p.sharedPost && (!updated.sharedPost || typeof updated.sharedPost !== 'object' || !updated.sharedPost.user)) {
            merged.sharedPost = p.sharedPost;
          }
          if (p.isShare) {
            merged.isShare = true;
          }
          return merged;
        }
        return p;
      })
    );
  }

  LoadBasedOnTabPost(tab: string) {
    const cleanTab = tab?.trim().toLowerCase() || 'community';
    this.activeTab.set(cleanTab);
    this.currentPage.set(1);
    this.hasMorePosts.set(true);
    this.isLoadingPosts.set(true);

    this.GetPostsByTab(cleanTab, 1, this.limit).subscribe({
      next: (res) => {
        const fetchedPosts: IPost[] = res?.data?.posts || res?.data?.bookmarks || [];
        if (cleanTab === 'saved') {
          this.savedPostIds.update((set) => {
            const next = new Set(set);
            fetchedPosts.forEach((p) => {
              const id = p._id || p.id;
              if (id) next.add(id);
            });
            return next;
          });
          fetchedPosts.forEach((p) => (p.bookmarked = true));
        }
        this.posts.set(fetchedPosts);
        this.isLoadingPosts.set(false);

        const totalPages = res?.meta?.pagination?.numberOfPages ?? res?.paginationInfo?.numberOfPages;
        if (fetchedPosts.length < this.limit || (totalPages !== undefined && 1 >= totalPages)) {
          this.hasMorePosts.set(false);
        }
      },
      error: (err) => {
        console.error('Error fetching initial posts for tab', cleanTab, err);
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
    const currentTab = this.activeTab();

    this.GetPostsByTab(currentTab, nextPage, this.limit).subscribe({
      next: (res) => {
        const fetchedPosts: IPost[] = res?.data?.posts || res?.data?.bookmarks || [];
        if (currentTab === 'saved') {
          this.savedPostIds.update((set) => {
            const next = new Set(set);
            fetchedPosts.forEach((p) => {
              const id = p._id || p.id;
              if (id) next.add(id);
            });
            return next;
          });
          fetchedPosts.forEach((p) => (p.bookmarked = true));
        }
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
        console.error('Error loading next page for tab', currentTab, err);
        this.isLoadingPosts.set(false);
      }
    });
  }

  GetPostsByTab(tab: string, page: number = 1, limit: number = 40): Observable<any> {
    if (tab === 'feed') {
      return this._HttpClient.get(
        `${environment.baseURL}/posts/feed?only=following&page=${page}&limit=${limit}`
      );
    }
    if (tab === 'saved') {
      return this._HttpClient.get(
        `${environment.baseURL}/users/bookmarks?page=${page}&limit=${limit}`
      );
    }
    return this._HttpClient.get(
      `${environment.baseURL}/posts?page=${page}&limit=${limit}`
    );
  }

  GetAllPosts(following?: boolean, page: number = 1, limit: number = 40): Observable<any> {
    return this.GetPostsByTab(following ? 'feed' : 'community', page, limit);
  }

  GetSavedPosts(page: number = 1, limit: number = 40): Observable<any> {
    return this.GetPostsByTab('saved', page, limit);
  }
  GetSinglePost(postId: string): Observable<any> {
    return this._HttpClient.get(`${environment.baseURL}/posts/${postId}`)
  }
  GetPostLikes(postId: string): Observable<any> {
    return this._HttpClient.get(`${environment.baseURL}/posts/${postId}`)
  }
  LikePost(postId: string): Observable<any> {
    return this._HttpClient.put(`${environment.baseURL}/posts/${postId}/like`, '')
  }
  SharePost(postId: string, postData?: any): Observable<any> {
    let payload: any = '';
    if (postData) {
      if (typeof postData === 'string') {
        payload = postData.trim() ? { body: postData.trim() } : '';
      } else if (typeof postData === 'object' && postData.body && postData.body.trim()) {
        payload = { body: postData.body.trim() };
      }
    }
    return this._HttpClient.post(`${environment.baseURL}/posts/${postId}/share`, payload);
  }

  incrementPostSharesCount(postId: string): void {
    this.posts.update((prev) =>
      prev.map((p) => {
        if ((p._id || p.id) === postId) {
          return {
            ...p,
            sharesCount: (p.sharesCount || 0) + 1,
          };
        }
        return p;
      })
    );
  }

  addPostToFeed(newPost: IPost): void {
    if (!newPost) return;
    this.posts.update((prev) => [newPost, ...prev]);
  }
  CreatePost(postData: FormData): Observable<any> {
    return this._HttpClient.post(`${environment.baseURL}/posts`, postData)
  }
  UpdatePost(postId: string, postData?: any): Observable<any> {
    return this._HttpClient.put(`${environment.baseURL}/posts/${postId}`, postData ?? '')
  }
  DeletePost(postId: string): Observable<any> {
    return this._HttpClient.delete(`${environment.baseURL}/posts/${postId}`)
  }
  BookmarkPosts(postId: string): Observable<any> {
    return this._HttpClient.put(`${environment.baseURL}/posts/${postId}/bookmark`, '')
  }
}
