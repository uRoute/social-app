import { Component, inject } from '@angular/core';
import { PostsService } from '../../../../core/auth/services/Posts/posts.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CreatePostComponent } from './Create-post/create-post/create-post.component';

@Component({
  selector: 'app-posts',
  imports: [RouterLink, RouterLinkActive , CreatePostComponent],
  templateUrl: './posts.component.html',
  styleUrl: './posts.component.css',
})
export class PostsComponent {
  private _PostsService = inject(PostsService)

}
