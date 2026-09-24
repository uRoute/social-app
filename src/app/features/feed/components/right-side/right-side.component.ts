import { Component, inject } from '@angular/core';
import { PostsService } from '../../../../core/auth/services/Posts/posts.service';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-right-side',
  imports: [RouterLink, RouterLinkActive ],
  templateUrl: './right-side.component.html',
  styleUrl: './right-side.component.css',
})
export class RightSideComponent {
  private _PostsService = inject(PostsService)

}
