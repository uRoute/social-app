import { Component, inject } from '@angular/core';
import { PostsService } from '../../../../core/auth/services/Posts/posts.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '../../../../shared/services/User/user.service';
import { ISuggest } from '../../../../core/models/Suggest/isuggest.interface';

@Component({
  selector: 'app-right-side',
  imports: [RouterLink, RouterLinkActive ],
  templateUrl: './right-side.component.html',
  styleUrl: './right-side.component.css',
})
export class RightSideComponent {
  private _PostsService = inject(PostsService)
  private _UserService = inject(UserService)

  suggestedFriends!:ISuggest[]

  ngOnInit(){
    this._UserService.GetFollowSuggestions().subscribe({
      next:(res)=>{
        this.suggestedFriends = res.data.suggestions
        console.log(this.suggestedFriends);
      },
      error:(err)=>{
        console.log(err);
      }
    })
  }

}
