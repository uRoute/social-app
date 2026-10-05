import { Component, computed, inject, OnInit, output, signal, WritableSignal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PostsService } from '../../../../../../core/auth/services/Posts/posts.service';
import { UserService } from '../../../../../../shared/services/User/user.service';

@Component({
  selector: 'app-create-post',
  imports: [ReactiveFormsModule],
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.css',
})
export class CreatePostComponent implements OnInit {
  private _PostsService = inject(PostsService)
  private _UserService = inject(UserService)
  postCreated = output<void>();
  postContent: FormControl = new FormControl('');
  postPrivacy: FormControl = new FormControl('public');
  imageFile: File | null = null;
  imgURL: WritableSignal<string | ArrayBuffer | null | undefined> = signal<string | ArrayBuffer | null | undefined>(null);
  // user data
  currentUserData = computed(() => this._UserService.userInfo());

  isLoading: WritableSignal<boolean> = signal<boolean>(false);

  ngOnInit(): void {

  }


  handlePostImage(e: Event) {
    const file = (e.target as HTMLInputElement);
    file.files && file.files.length > 0 ? this.imageFile = file.files[0] : null;
    this.fileReader();
  }
  fileReader() {
    const _FileReader = new FileReader()
    _FileReader.readAsDataURL(this.imageFile!)
    _FileReader.onload = (e: ProgressEvent<FileReader>) => {
      this.imgURL.set(e.target?.result)
    }
  }

  removeImg() {
    this.imageFile = null;
    this.imgURL.set(null);
  }

  createNewPost(e: Event, form: HTMLFormElement) {
    e.preventDefault();

    const content = this.postContent.value;
    if (!this.imageFile && (!content || content.trim() === '')) {
      return;
    }

    let formData = new FormData();

    if (this.imageFile) {
      formData.append('image', this.imageFile);
    }
    if (content != null && content.trim() !== '') {
      formData.append('body', content);
    }
    if (this.postPrivacy.value != null) {
      formData.append('privacy', this.postPrivacy.value);
    }

    this.isLoading.set(true);

    this._PostsService.CreatePost(formData).subscribe({
      next: (res) => {
        console.log(res);
        this.removeImg();
        form.reset();
        this.postContent.reset('');
        this.postPrivacy.reset('public');
        this.isLoading.set(false);
        this._PostsService.LoadBasedOnTabPost(this._PostsService.activeTab());
        this.postCreated.emit();
      },
      error: (err) => {
        console.log(err);
        this.isLoading.set(false);
      }
    });

  }

}
