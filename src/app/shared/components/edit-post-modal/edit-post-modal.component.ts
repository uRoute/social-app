import { Component, effect, inject, input, output, signal, WritableSignal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { PostsService } from '../../../core/auth/services/Posts/posts.service';
import { IPost } from '../../../core/models/Post/ipost.interface';

@Component({
  selector: 'app-edit-post-modal',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './edit-post-modal.component.html',
  styleUrl: './edit-post-modal.component.css',
})
export class EditPostModalComponent {
  private _PostsService = inject(PostsService);

  post = input<IPost | null>(null);
  isOpen = input<boolean>(false);

  closeModal = output<void>();
  postUpdated = output<IPost>();

  postContent: FormControl = new FormControl('');
  postPrivacy: FormControl = new FormControl('public');

  existingImage: WritableSignal<string | null> = signal<string | null>(null);
  newImageFile: File | null = null;
  newImagePreview: WritableSignal<string | null> = signal<string | null>(null);

  isLoading: WritableSignal<boolean> = signal<boolean>(false);
  errorMessage: WritableSignal<string | null> = signal<string | null>(null);

  constructor() {
    effect(() => {
      const p = this.post();
      const open = this.isOpen();
      if (open && p) {
        this.postContent.setValue(p.body || '');
        this.postPrivacy.setValue(p.privacy || 'public');
        this.existingImage.set(p.image || null);
        this.newImageFile = null;
        this.newImagePreview.set(null);
        this.errorMessage.set(null);
        this.isLoading.set(false);
      }
    });
  }

  isSharedPost(): boolean {
    const p = this.post();
    return !!(p && (p.isShare || p.sharedPost));
  }

  isSharedPostObject(sp: any): boolean {
    return !!(sp && typeof sp === 'object' && (sp.user || sp.body));
  }

  handleImageSelect(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    if (inputEl.files && inputEl.files.length > 0) {
      this.newImageFile = inputEl.files[0];
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.newImagePreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(this.newImageFile);
    }
  }

  removeNewImage(): void {
    this.newImageFile = null;
    this.newImagePreview.set(null);
  }

  removeExistingImage(): void {
    this.existingImage.set(null);
  }

  close(): void {
    if (this.isLoading()) return;
    this.closeModal.emit();
  }

  submitEdit(): void {
    const currentPost = this.post();
    if (!currentPost) return;

    const postId = currentPost._id || currentPost.id;
    if (!postId) return;

    const content = (this.postContent.value || '').trim();
    const hasImage = !!this.newImageFile || !!this.existingImage();
    const isShared = this.isSharedPost();

    if (!isShared && !content && !hasImage) {
      this.errorMessage.set('Post cannot be empty. Please enter some text or add an image.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formData = new FormData();
    if (content) {
      formData.append('body', content);
    }
    if (this.newImageFile) {
      formData.append('image', this.newImageFile);
    }
    if (this.postPrivacy.value) {
      formData.append('privacy', this.postPrivacy.value);
    }

    this._PostsService.UpdatePost(postId, formData).subscribe({
      next: (res: any) => {
        const returnedPost = res?.data?.post || res?.post || res?.data;

        // Preserve populated sharedPost and isShare flag.
        // Route Misr PUT /posts/:id returns unpopulated sharedPost (string ID) or undefined.
        const preservedSharedPost =
          (returnedPost?.sharedPost && typeof returnedPost.sharedPost === 'object' && (returnedPost.sharedPost.user || returnedPost.sharedPost.body))
            ? returnedPost.sharedPost
            : currentPost.sharedPost;

        const preservedIsShare =
          typeof returnedPost?.isShare === 'boolean'
            ? returnedPost.isShare
            : (currentPost.isShare ?? !!currentPost.sharedPost);

        const updatedPost: IPost = {
          ...currentPost,
          ...(returnedPost || {}),
          sharedPost: preservedSharedPost,
          isShare: preservedIsShare,
          body: returnedPost?.body ?? content,
          image: this.newImagePreview() ?? (this.existingImage() ?? (returnedPost?.image || '')),
          privacy: this.postPrivacy.value || currentPost.privacy,
        };

        this._PostsService.updatePostInState(postId, updatedPost);
        this.isLoading.set(false);
        this.postUpdated.emit(updatedPost);
        this.closeModal.emit();
      },
      error: (err: any) => {
        console.error('Error updating post:', err);
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message || 'Failed to update post. Please try again.'
        );
      },
    });
  }
}
