import { Component, computed, effect, inject, input, output, signal, WritableSignal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { PostsService } from '../../../core/auth/services/Posts/posts.service';
import { UserService } from '../../services/User/user.service';
import { IPost } from '../../../core/models/Post/ipost.interface';

@Component({
  selector: 'app-share-post-modal',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './share-post-modal.component.html',
  styleUrl: './share-post-modal.component.css',
})
export class SharePostModalComponent {
  private _PostsService = inject(PostsService);
  private _UserService = inject(UserService);

  post = input<IPost | null>(null);
  isOpen = input<boolean>(false);

  closeModal = output<void>();
  postShared = output<{ originalPostId: string; sharedPost?: IPost }>();

  shareComment: FormControl = new FormControl('');
  isLoading: WritableSignal<boolean> = signal<boolean>(false);
  errorMessage: WritableSignal<string | null> = signal<string | null>(null);
  isCopied: WritableSignal<boolean> = signal<boolean>(false);

  currentUser = computed(() => this._UserService.userInfo());

  constructor() {
    effect(() => {
      const open = this.isOpen();
      if (open) {
        this.shareComment.setValue('');
        this.isLoading.set(false);
        this.errorMessage.set(null);
        this.isCopied.set(false);
      }
    });
  }

  close(): void {
    if (this.isLoading()) return;
    this.closeModal.emit();
  }

  copyLink(): void {
    const p = this.post();
    if (!p) return;
    const postId = p._id || p.id;
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/userprofile/${p.user?._id || ''}`
      : '';

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.isCopied.set(true);
        setTimeout(() => this.isCopied.set(false), 2200);
      }).catch(() => {
        this.isCopied.set(true);
        setTimeout(() => this.isCopied.set(false), 2200);
      });
    }
  }

  submitShare(): void {
    const currentPost = this.post();
    if (!currentPost) return;

    const postId = currentPost._id || currentPost.id;
    if (!postId) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const comment = (this.shareComment.value || '').trim();
    const payload = comment ? { body: comment } : undefined;

    this._PostsService.SharePost(postId, payload).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);

        // Update shares count in posts signal
        this._PostsService.incrementPostSharesCount(postId);

        const sharedPost = res?.data?.post || res?.post || res?.data;
        if (sharedPost) {
          this._PostsService.addPostToFeed(sharedPost);
        }

        this.postShared.emit({
          originalPostId: postId,
          sharedPost: sharedPost,
        });

        this.closeModal.emit();
      },
      error: (err: any) => {
        console.error('Error sharing post:', err);
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message || 'Failed to share post. Please try again.'
        );
      },
    });
  }
}
