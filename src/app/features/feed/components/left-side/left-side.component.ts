import { Component, inject, OnInit } from '@angular/core';
import { PostsService } from '../../../../core/auth/services/Posts/posts.service';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-left-side',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './left-side.component.html',
  styleUrl: './left-side.component.css',
})
export class LeftSideComponent implements OnInit {
  private _PostsService = inject(PostsService)
  actvieState: string = 'community'

  changeFeed(tab: string) {
    this.actvieState = tab;
    this._PostsService.LoadBasedOnTabPost(tab);
  }

  ngOnInit(): void {
    this._PostsService.LoadBasedOnTabPost(this.actvieState)
  }

}
