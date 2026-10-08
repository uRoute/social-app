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
import { EditPostModalComponent } from '../../../../shared/components/edit-post-modal/edit-post-modal.component';
import { DeletePostModalComponent } from '../../../../shared/components/delete-post-modal/delete-post-modal.component';
import { SharePostModalComponent } from '../../../../shared/components/share-post-modal/share-post-modal.component';

@Component({
  selector: 'app-posts',
  imports: [RouterLink, CreatePostComponent, DatePipe, CommentsComponent, EditPostModalComponent, DeletePostModalComponent, SharePostModalComponent],
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
  isEditModalOpen = signal<boolean>(false);
  selectedPostToEdit = signal<IPost | null>(null);
  isDeleteModalOpen = signal<boolean>(false);
  selectedPostToDelete = signal<IPost | null>(null);
  isShareModalOpen = signal<boolean>(false);
  selectedPostToShare = signal<IPost | null>(null);

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

  onCommentLiked(event: { commentId: string; postId: string; likes?: string[] }): void {
    const currentUserId = this._UserService.userInfo()?._id;
    if (!currentUserId) return;

    this.postCommentsMap.update((map) => {
      const comments = map[event.postId];
      if (!comments) return map;
      return {
        ...map,
        [event.postId]: comments.map((c) => {
          if (c._id === event.commentId) {
            const currentLikes = c.likes || [];
            const hasLiked = currentLikes.some((like: any) =>
              typeof like === 'string' ? like === currentUserId : like?._id === currentUserId
            );
            const updatedLikes = event.likes ?? (hasLiked
              ? currentLikes.filter((id: any) => (typeof id === 'string' ? id : id?._id) !== currentUserId)
              : [...currentLikes, currentUserId]);
            return {
              ...c,
              likes: updatedLikes,
            };
          }
          return c;
        }),
      };
    });
  }

  likeComment(comment: IComment, postId: string): void {
    const currentUserId = this._UserService.userInfo()?._id;
    if (!currentUserId || !comment?._id || !postId) return;

    this._CommentsService.LikeOrDislikeComment(comment._id, postId).subscribe({
      next: () => {
        this.onCommentLiked({ commentId: comment._id, postId });
      },
      error: (err) => {
        console.error('Error liking comment:', err);
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

  toggleSavePost(post: IPost): void {
    const postId = post._id || post.id;
    if (!postId) return;
    this.closeDropdown();

    this._PostsService.BookmarkPosts(postId).subscribe({
      next: () => {
        this._PostsService.toggleBookmarkInState(postId);
      },
      error: (err) => {
        console.error('Error toggling bookmark on post:', err);
      },
    });
  }

  isPostSaved(post: IPost): boolean {
    return this._PostsService.isPostSaved(post);
  }

  isPostAuthor(post: IPost): boolean {
    const authorId = post.user?._id || (post.user as any)?.id;
    const currentUserId = this.currentUserData()?._id || (this.currentUserData() as any)?.id;
    return !!(authorId && currentUserId && authorId === currentUserId);
  }

  openEditModal(post: IPost): void {
    this.closeDropdown();
    this.selectedPostToEdit.set(post);
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.selectedPostToEdit.set(null);
  }

  onPostUpdated(updatedPost: IPost): void {
    // State is already updated in PostsService
  }

  openDeleteModal(post: IPost): void {
    this.closeDropdown();
    this.selectedPostToDelete.set(post);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.selectedPostToDelete.set(null);
  }

  onPostDeleted(postId: string): void {
    // State is already updated in PostsService
  }

  openShareModal(post: IPost): void {
    this.closeDropdown();
    this.selectedPostToShare.set(post);
    this.isShareModalOpen.set(true);
  }

  closeShareModal(): void {
    this.isShareModalOpen.set(false);
    this.selectedPostToShare.set(null);
  }

  onPostShared(event: { originalPostId: string; sharedPost?: IPost }): void {
    // Post was shared; PostsService has already updated state
  }
}
