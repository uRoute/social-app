import { Component } from '@angular/core';
import { LeftSideComponent } from '../components/left-side/left-side.component';
import { PostsComponent } from '../components/posts/posts.component';
import { RightSideComponent } from '../components/right-side/right-side.component';

@Component({
  selector: 'app-feed',
  imports: [LeftSideComponent, PostsComponent, RightSideComponent],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css',
})
export class FeedComponent {}
