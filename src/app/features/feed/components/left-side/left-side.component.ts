import { Component, inject } from '@angular/core';
import { PostsService } from '../../../../core/auth/services/Posts/posts.service';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-left-side',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './left-side.component.html',
  styleUrl: './left-side.component.css',
})
export class LeftSideComponent {
  private _PostsService = inject(PostsService)
  actvieState:string = 'community'

  changeFeed(eventInfo:PointerEvent){
    let targetElement = eventInfo.target as HTMLElement
    this.actvieState = targetElement?.innerText.toLowerCase()
    
  }


}
