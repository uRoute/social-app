import { Component, inject, input, output, signal, WritableSignal } from '@angular/core';
import { IComment } from '../../../../../../core/models/Comment/icomment.interface';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommentsService } from '../../../../../../shared/services/comments.service';
import { UserService } from '../../../../../../shared/services/User/user.service';

@Component({
  selector: 'app-comments',
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './comments.component.html',
  styleUrl: './comments.component.css',
})
export class CommentsComponent {
  private _CommentsService = inject(CommentsService);
  private _UserService = inject(UserService);

  get currentUserData() {
    return this._UserService.userInfo();
  }

  postId = input<string>('');
  postComments = input<IComment[]>([]);
  isLoading = input<boolean>(false);
  commentCreated = output<string>();
  commentLiked = output<{ commentId: string; postId: string; likes: string[] }>();

  likingCommentIds: WritableSignal<Set<string>> = signal<Set<string>>(new Set<string>());

  commentContent: FormControl = new FormControl('');
  imageFile: File | null = null;
  imgURL: WritableSignal<string | ArrayBuffer | null | undefined> = signal<string | ArrayBuffer | null | undefined>(null);
  isSubmitting: WritableSignal<boolean> = signal<boolean>(false);

  handleCommentImage(e: Event) {
    const file = e.target as HTMLInputElement;
    file.files && file.files.length > 0 ? (this.imageFile = file.files[0]) : null;
    this.fileReader();
  }

  fileReader() {
    const _FileReader = new FileReader();
    _FileReader.readAsDataURL(this.imageFile!);
    _FileReader.onload = (e: ProgressEvent<FileReader>) => {
      this.imgURL.set(e.target?.result);
    };
  }

  removeImg() {
    this.imageFile = null;
    this.imgURL.set(null);
  }

  createNewComment(e: Event, form: HTMLFormElement) {
    e.preventDefault();

    const content = this.commentContent.value;
    if (!this.imageFile && (!content || content.trim() === '')) {
      return;
    }

    const currentPostId = this.postId();
    if (!currentPostId) {
      console.warn('Cannot create comment: No postId provided.');
      return;
    }

    let formData = new FormData();
    if (this.imageFile) {
      formData.append('image', this.imageFile);
    }
    if (content != null && content.trim() !== '') {
      formData.append('content', content);
    }

    this.isSubmitting.set(true);

    this._CommentsService.CreateComment(formData, currentPostId).subscribe({
      next: (res) => {
        console.log(res);
        this.removeImg();
        form.reset();
        this.commentContent.reset('');
        this.isSubmitting.set(false);
        this.commentCreated.emit(currentPostId);
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting.set(false);
      },
    });
  }

  isCommentLiked(comment: IComment): boolean {
    const currentUserId = this._UserService.userInfo()?._id;
    if (!currentUserId || !comment?.likes) return false;
    return comment.likes.some((like: any) =>
      typeof like === 'string' ? like === currentUserId : like?._id === currentUserId
    );
  }

  isCommentLiking(commentId: string): boolean {
    return this.likingCommentIds().has(commentId);
  }

  likeComment(comment: IComment): void {
    const currentUserId = this._UserService.userInfo()?._id;
    if (!currentUserId) return;

    const currentPostId = this.postId() || comment.post;
    if (!currentPostId || !comment._id) return;

    if (this.likingCommentIds().has(comment._id)) return;

    this.likingCommentIds.update((set) => new Set(set).add(comment._id));

    this._CommentsService.LikeOrDislikeComment(comment._id, currentPostId).subscribe({
      next: () => {
        const likes = comment.likes || [];
        const hasLiked = this.isCommentLiked(comment);
        const updatedLikes = hasLiked
          ? likes.filter((id: any) => (typeof id === 'string' ? id : id?._id) !== currentUserId)
          : [...likes, currentUserId];

        comment.likes = updatedLikes;

        this.commentLiked.emit({
          commentId: comment._id,
          postId: currentPostId,
          likes: updatedLikes,
        });

        this.likingCommentIds.update((set) => {
          const updated = new Set(set);
          updated.delete(comment._id);
          return updated;
        });
      },
      error: (err) => {
        console.error('Error liking/unliking comment:', err);
        this.likingCommentIds.update((set) => {
          const updated = new Set(set);
          updated.delete(comment._id);
          return updated;
        });
      },
    });
  }
}

