import { AfterViewChecked, Component, computed, inject, OnInit, Signal } from '@angular/core';
import { PostsService } from '../../../../core/auth/services/Posts/posts.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CreatePostComponent } from './Create-post/create-post/create-post.component';
import { IPost } from '../../../../core/models/Post/ipost.interface';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-posts',
  imports: [RouterLink, RouterLinkActive, CreatePostComponent, DatePipe],
  templateUrl: './posts.component.html',
  styleUrl: './posts.component.css',
})
export class PostsComponent implements OnInit, AfterViewChecked {
  private _PostsService = inject(PostsService)

  posts: Signal<IPost[]> = computed(() => this._PostsService.posts())

  ngOnInit(): void {

  }

  ngAfterViewChecked() {
    // console.log(this._PostsService.posts());
    // console.log(this.posts);

  }

}
