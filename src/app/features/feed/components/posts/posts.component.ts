import { AfterViewChecked, Component, computed, inject, OnInit, signal, Signal, WritableSignal } from '@angular/core';
import { PostsService } from '../../../../core/auth/services/Posts/posts.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CreatePostComponent } from './Create-post/create-post/create-post.component';
import { IPost } from '../../../../core/models/Post/ipost.interface';
import { DatePipe } from '@angular/common';
import { CommentsComponent } from './Comments/comments/comments.component';
import { CommentsService } from '../../../../shared/services/comments.service';
import { IComment } from '../../../../core/models/Comment/icomment.interface';

@Component({
  selector: 'app-posts',
  imports: [RouterLink, RouterLinkActive, CreatePostComponent, DatePipe, CommentsComponent],
  templateUrl: './posts.component.html',
  styleUrl: './posts.component.css',
})
export class PostsComponent implements OnInit, AfterViewChecked {
  private _PostsService = inject(PostsService)
  private _CommentsService = inject(CommentsService)
  posts: Signal<IPost[]> = computed(() => this._PostsService.posts())
  expandedCommentPosts = signal<Set<string>>(new Set<string>())
  postComments: WritableSignal<IComment[]> = signal([]);

  toggleComments(postId: string): void {
    this.expandedCommentPosts.update((currentSet) => {
      const newSet = new Set(currentSet);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
        this._CommentsService.GetPostComments(postId).subscribe({
          next: (res) => {
            this.postComments.set(res.data.comments)
          }
        })
      }
      return newSet;
    });

  }

  isCommentsOpen(postId: string): boolean {
    return this.expandedCommentPosts().has(postId);
  }

  ngOnInit(): void {

  }

  ngAfterViewChecked() {
    // console.log(this._PostsService.posts());
    // console.log(this.posts);

  }

}
