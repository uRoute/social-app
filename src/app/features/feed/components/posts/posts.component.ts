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

@Component({
  selector: 'app-posts',
  imports: [RouterLink, RouterLinkActive, CreatePostComponent, DatePipe, CommentsComponent],
  templateUrl: './posts.component.html',
  styleUrl: './posts.component.css',
})
export class PostsComponent implements OnInit, AfterViewChecked, AfterViewInit, OnDestroy {
  readonly postsService = inject(PostsService);
  private _CommentsService = inject(CommentsService);

  @ViewChild('sentinel') sentinel?: ElementRef<HTMLElement>;
  private observer?: IntersectionObserver;

  posts: Signal<IPost[]> = computed(() => this.postsService.posts());
  isLoadingPosts: Signal<boolean> = computed(() => this.postsService.isLoadingPosts());
  hasMorePosts: Signal<boolean> = computed(() => this.postsService.hasMorePosts());

  expandedCommentPosts = signal<Set<string>>(new Set<string>());
  postCommentsMap = signal<Record<string, IComment[]>>({});
  loadingCommentsPosts = signal<Set<string>>(new Set<string>());

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            this.postsService.loadNextPage();
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
        this.postsService.loadNextPage();
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

  isCommentsOpen(postId: string): boolean {
    return this.expandedCommentPosts().has(postId);
  }

  isCommentsLoading(postId: string): boolean {
    return this.loadingCommentsPosts().has(postId) && !this.postCommentsMap()[postId];
  }

  getPostComments(postId: string): IComment[] {
    return this.postCommentsMap()[postId] || [];
  }

  ngOnInit(): void {

  }

  ngAfterViewChecked() {
    // console.log(this._PostsService.posts());
    // console.log(this.posts);

  }

}
