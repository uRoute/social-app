import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { IUser } from '../../../core/models/UserInfo/iuser.interface';
import { UserService } from '../../../shared/services/User/user.service';
import { DatePipe } from '@angular/common';
import { IPost } from '../../../core/models/Post/ipost.interface';
import { CommentsComponent } from '../../feed/components/posts/Comments/comments/comments.component';
import { CommentsService } from '../../../shared/services/comments.service';
import { PostsService } from '../../../core/auth/services/Posts/posts.service';
import { IComment } from '../../../core/models/Comment/icomment.interface';
import { CreatePostComponent } from '../../feed/components/posts/Create-post/create-post/create-post.component';

@Component({
  selector: 'app-profile',
  imports: [DatePipe, CommentsComponent, CreatePostComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private _UserService = inject(UserService);
  private _CommentsService = inject(CommentsService);
  private _PostsService = inject(PostsService);

  profileImage = './Images/default-profile.png';
  coverImage: string | null = null;
  user: WritableSignal<IUser> = signal({} as IUser);
  userPosts: WritableSignal<IPost[]> = signal([]);
  isLoadingPosts: WritableSignal<boolean> = signal(false);

  expandedCommentPosts = signal<Set<string>>(new Set<string>());
  postCommentsMap = signal<Record<string, IComment[]>>({});
  loadingCommentsPosts = signal<Set<string>>(new Set<string>());

  ngOnInit(): void {
    const initialUserId = this._UserService.userInfo()?._id;
    if (initialUserId) {
      this.getUserPosts(initialUserId);
    }

    this._UserService.GetMyProfile().subscribe({
      next: (res) => {
        this.user.set(res.data.user);
        const userId = res.data.user?._id || res.data.user?.id;
        if (userId && (!this.userPosts().length || !initialUserId)) {
          this.getUserPosts(userId);
        }
      },
      error: (err) => {
        console.error('Error fetching profile:', err);
      },
    });
  }

  getUserPosts(userId?: string): void {
    const id =
      userId ||
      this._UserService.userInfo()?._id ||
      this.user()?._id ||
      this.user()?.id;

    if (!id) return;

    this.isLoadingPosts.set(true);
    this._UserService.GetUserPosts(id).subscribe({
      next: (res) => {
        const posts: IPost[] = res?.data?.posts || res?.posts || [];
        this.userPosts.set(posts);
        this.isLoadingPosts.set(false);
      },
      error: (err) => {
        console.error('Error fetching user posts:', err);
        this.isLoadingPosts.set(false);
      },
    });
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
        const currentUserId = this.user()?._id || this._UserService.userInfo()?._id;
        if (!currentUserId) return;

        this.userPosts.update((posts) =>
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
    const currentUserId = this.user()?._id || this._UserService.userInfo()?._id;
    return !!(currentUserId && post.likes?.includes(currentUserId));
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formData = new FormData();
    if (input.files && input.files[0]) {
      const file = input.files[0];
      formData.append('photo', file);
      this._UserService.UpdateProfileImage(formData).subscribe({
        next: (res) => {
          console.log(res);
        },
        error: (err) => {
          console.error(err);
        }
      })
      // const reader = new FileReader();
      // reader.onload = () => {
      //   this.profileImage = reader.result as string;
      // };
      // reader.readAsDataURL(file);
    }
  }

  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.coverImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
}
