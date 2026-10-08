import { Component, computed, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { UserService } from '../../../shared/services/User/user.service';
import { ActivatedRoute } from '@angular/router';
import { IUser } from '../../../core/models/UserInfo/iuser.interface';
import { IPost } from '../../../core/models/Post/ipost.interface';
import { DatePipe } from '@angular/common';
import { CommentsComponent } from '../../feed/components/posts/Comments/comments/comments.component';
import { CommentsService } from '../../../shared/services/comments.service';
import { PostsService } from '../../../core/auth/services/Posts/posts.service';
import { IComment } from '../../../core/models/Comment/icomment.interface';

@Component({
  selector: 'app-user-profile',
  imports: [DatePipe, CommentsComponent],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
})
export class UserProfileComponent implements OnInit {
  private _UserService = inject(UserService);
  private _ActivatedRoute = inject(ActivatedRoute);
  private _CommentsService = inject(CommentsService);
  private _PostsService = inject(PostsService);

  profileImage = './Images/default-profile.png';
  userId = signal<string>('');
  userProfileData = signal<IUser>({} as IUser);
  userPosts = signal<IPost[]>([]);

  isLoadingProfile = signal<boolean>(true);
  isLoadingPosts = signal<boolean>(false);
  isFollowLoading = signal<boolean>(false);
  isFollowing = signal<boolean>(false);

  expandedCommentPosts = signal<Set<string>>(new Set<string>());
  postCommentsMap = signal<Record<string, IComment[]>>({});
  loadingCommentsPosts = signal<Set<string>>(new Set<string>());

  isOwnProfile = computed(() => {
    const currentUserId = this._UserService.userInfo()?._id;
    const profileId = this.userId();
    return !!(currentUserId && profileId && currentUserId === profileId);
  });

  ngOnInit(): void {
    this._ActivatedRoute.paramMap.subscribe((data) => {
      const id = data.get('id');
      if (id) {
        this.userId.set(id);
        this.getUserProfile();
        this.getUserPosts(id);
      }
    });
  }

  getUserProfile(showLoading = true): void {
    const userId = this.userId();
    if (!userId) return;

    if (showLoading) {
      this.isLoadingProfile.set(true);
    }

    this._UserService.GetUserProfile(userId).subscribe({
      next: (res) => {
        const userData: IUser = res?.data?.user || res?.user || ({} as IUser);
        this.userProfileData.set(userData);

        const currentUserId = this._UserService.userInfo()?._id;
        let following = false;
        if (typeof (userData as any).isFollowing === 'boolean') {
          following = (userData as any).isFollowing;
        } else if (Array.isArray(userData.followers) && currentUserId) {
          following = userData.followers.some((f: any) =>
            typeof f === 'string' ? f === currentUserId : f?._id === currentUserId || f?.id === currentUserId
          );
        }
        this.isFollowing.set(following);
        this.isLoadingProfile.set(false);
      },
      error: (error) => {
        console.error('Error fetching user profile:', error);
        this.isLoadingProfile.set(false);
      },
    });
  }

  getUserPosts(userId?: string): void {
    const id = userId || this.userId();
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

  followOrUnfollow(): void {
    const targetId = this.userId();
    if (!targetId || this.isFollowLoading()) return;

    this.isFollowLoading.set(true);
    this._UserService.FollowOrUnFollowUser(targetId).subscribe({
      next: () => {
        const newFollowState = !this.isFollowing();
        this.isFollowing.set(newFollowState);

        this.userProfileData.update((prev) => {
          if (!prev) return prev;
          const currentCount = prev.followersCount ?? (prev.followers?.length || 0);
          const newCount = newFollowState ? currentCount + 1 : Math.max(0, currentCount - 1);
          return {
            ...prev,
            followersCount: newCount,
          };
        });

        this.getUserProfile(false);
        this.isFollowLoading.set(false);
      },
      error: (err) => {
        console.error('Error following/unfollowing user:', err);
        this.isFollowLoading.set(false);
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
        const currentUserId = this._UserService.userInfo()?._id;
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
    const currentUserId = this._UserService.userInfo()?._id;
    return !!(currentUserId && post.likes?.includes(currentUserId));
  }
}
