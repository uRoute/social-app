import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
  Signal,
  ViewChild,
} from '@angular/core';
import { PostsService } from '../../../../core/auth/services/Posts/posts.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CreatePostComponent } from './Create-post/create-post/create-post.component';
import { IPost } from '../../../../core/models/Post/ipost.interface';
import { DatePipe } from '@angular/common';
import { CommentsComponent } from './Comments/comments/comments.component';
import { CommentsService } from '../../../../shared/services/comments.service';
import { IComment } from '../../../../core/models/Comment/icomment.interface';
import { UserService } from '../../../../shared/services/User/user.service';

@Component({
  selector: 'app-posts',
  imports: [RouterLink, RouterLinkActive, CreatePostComponent, DatePipe, CommentsComponent],
  templateUrl: './posts.component.html',
  styleUrl: './posts.component.css',
})
export class PostsComponent implements OnInit, AfterViewChecked, AfterViewInit, OnDestroy {
  readonly _PostsService = inject(PostsService);
  private observer?: IntersectionObserver;
  private _CommentsService = inject(CommentsService);
  private _UserService = inject(UserService);
  @ViewChild('sentinel') sentinel?: ElementRef<HTMLElement>;
  currentUserData = computed(() => this._UserService.userInfo());
  activeDropdownPostId = signal<string | null>(null);
  posts: Signal<IPost[]> = computed(() => this._PostsService.posts());
  isLoadingPosts: Signal<boolean> = computed(() => this._PostsService.isLoadingPosts());
  hasMorePosts: Signal<boolean> = computed(() => this._PostsService.hasMorePosts());
  expandedCommentPosts = signal<Set<string>>(new Set<string>());
  postCommentsMap = signal<Record<string, IComment[]>>({});
  loadingCommentsPosts = signal<Set<string>>(new Set<string>());

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            this._PostsService.loadNextPage();
          }
        },
        {
          root: null,
          rootMargin: '300px',
          threshold: 0,
        }
      );

      if (this.sentinel?.nativeElement) {
        this.observer.observe(this.sentinel.nativeElement);
      }
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (typeof window !== 'undefined') {
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 600;
      if (scrollPosition >= threshold) {
        this._PostsService.loadNextPage();
      }
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  toggleComments(postId: string): void {
    this.expandedCommentPosts.update((currentSet) => {
      const newSet = new Set(currentSet);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
        this.loadingCommentsPosts.update((set) => new Set(set).add(postId));
        this._CommentsService.GetPostComments(postId).subscribe({
          next: (res) => {
            this.postCommentsMap.update((map) => ({
              ...map,
              [postId]: res.data.comments,
            }));
            this.loadingCommentsPosts.update((set) => {
              const updated = new Set(set);
              updated.delete(postId);
              return updated;
            });
          },
          error: (err) => {
            console.error('Error loading comments:', err);
            this.loadingCommentsPosts.update((set) => {
              const updated = new Set(set);
              updated.delete(postId);
              return updated;
            });
          },
        });
      }
      return newSet;
    });
  }

  onCommentCreated(postId: string): void {
    this._CommentsService.GetPostComments(postId).subscribe({
      next: (res) => {
        this.postCommentsMap.update((map) => ({
          ...map,
          [postId]: res.data.comments,
        }));
      },
      error: (err) => {
        console.error('Error refreshing comments:', err);
      },
    });
  }

  isCommentsOpen(postId: string): boolean {
    return this.expandedCommentPosts().has(postId);
  }

  isCommentsLoading(postId: string): boolean {
    return this.loadingCommentsPosts().has(postId) && !this.postCommentsMap()[postId];
  }

  getPostComments(postId: string): IComment[] {
    return this.postCommentsMap()[postId] || [];
  }

  likePost(post: IPost): void {
    const postId = post._id || post.id;
    if (!postId) return;

    this._PostsService.LikePost(postId).subscribe({
      next: () => {
        const currentUserId = this._UserService.userInfo()?._id;
        if (!currentUserId) return;

        this._PostsService.posts.update((posts) =>
          posts.map((p) => {
            if ((p._id || p.id) === postId) {
              const likesArray = p.likes || [];
              const hasLiked = likesArray.includes(currentUserId);
              const updatedLikes = hasLiked
                ? likesArray.filter((id) => id !== currentUserId)
                : [...likesArray, currentUserId];

              return {
                ...p,
                likes: updatedLikes,
                likesCount: updatedLikes.length,
              };
            }
            return p;
          })
        );
      },
      error: (err) => {
        console.error('Error liking post:', err);
      },
    });
  }

  isPostLiked(post: IPost): boolean {
    const currentUserId = this._UserService.userInfo()?._id;
    return !!(currentUserId && post.likes?.includes(currentUserId));
  }

  ngOnInit(): void {
    if (!this._UserService.userInfo()?._id) {
      this._UserService.GetMyProfile().subscribe({
        next: (res) => {
          if (res?.data?.user) {
            this._UserService.userInfo.set(res.data.user);
          }
        },
        error: (err) => {
          console.error('Error fetching profile in posts:', err);
        },
      });
    }
  }

  ngAfterViewChecked() {
    // console.log(this._PostsService.posts());
    // console.log(this.posts);

  }


  @HostListener('document:click')
  onDocumentClick(): void {
    this.activeDropdownPostId.set(null);
  }

  toggleDropdown(postId: string, event?: Event): void {
    event?.stopPropagation();
    this.activeDropdownPostId.update((current) => (current === postId ? null : postId));
  }

  closeDropdown(): void {
    this.activeDropdownPostId.set(null);
  }
}
