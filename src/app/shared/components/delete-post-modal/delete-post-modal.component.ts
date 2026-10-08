import { Component, effect, inject, input, output, signal, WritableSignal } from '@angular/core';
import { PostsService } from '../../../core/auth/services/Posts/posts.service';
import { IPost } from '../../../core/models/Post/ipost.interface';

@Component({
  selector: 'app-delete-post-modal',
  imports: [],
  templateUrl: './delete-post-modal.component.html',
  styleUrl: './delete-post-modal.component.css',
})
export class DeletePostModalComponent {
  private _PostsService = inject(PostsService);

  post = input<IPost | null>(null);
  isOpen = input<boolean>(false);

  closeModal = output<void>();
  postDeleted = output<string>();

  isDeleting: WritableSignal<boolean> = signal<boolean>(false);
  errorMessage: WritableSignal<string | null> = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.isDeleting.set(false);
        this.errorMessage.set(null);
      }
    });
  }

  close(): void {
    if (this.isDeleting()) return;
    this.closeModal.emit();
  }

  confirmDelete(): void {
    const currentPost = this.post();
    if (!currentPost) return;

    const postId = currentPost._id || currentPost.id;
    if (!postId) return;

    this.isDeleting.set(true);
    this.errorMessage.set(null);

    this._PostsService.DeletePost(postId).subscribe({
      next: () => {
        this._PostsService.removePostFromState(postId);
        this.isDeleting.set(false);
        this.postDeleted.emit(postId);
        this.closeModal.emit();
      },
      error: (err: any) => {
        console.error('Error deleting post:', err);
        this.isDeleting.set(false);
        this.errorMessage.set(
          err?.error?.message || 'Failed to delete post. Please try again.'
        );
      },
    });
  }
}
