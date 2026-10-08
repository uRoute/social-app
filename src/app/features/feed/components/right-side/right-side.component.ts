import { Component, inject, signal, WritableSignal } from '@angular/core';
import { PostsService } from '../../../../core/auth/services/Posts/posts.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '../../../../shared/services/User/user.service';
import { ISuggest } from '../../../../core/models/Suggest/isuggest.interface';
import { SearchPipe } from '../../../../shared/pipes/Search/search-pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-right-side',
  imports: [RouterLink, RouterLinkActive, SearchPipe, FormsModule],
  templateUrl: './right-side.component.html',
  styleUrl: './right-side.component.css',
})
export class RightSideComponent {
  private _PostsService = inject(PostsService)
  private _UserService = inject(UserService)

  searchQuery = signal<string>("")
  suggestedFriends: WritableSignal<ISuggest[]> = signal([])

  ngOnInit() {
    this.getSuggestedFriends()
  }
  getSuggestedFriends() {
    this._UserService.GetFollowSuggestions().subscribe({
      next: (res) => {
        this.suggestedFriends.set(res.data.suggestions)
      },
      error: (err) => {
        console.log(err);
      }
    })
  }
  followOrUnfollow(userId: string) {
    this._UserService.FollowOrUnFollowUser(userId).subscribe({
      next: (res) => {
        this.getSuggestedFriends()
      },
      error: (err) => {
        console.log(err);
      }
    })
  }

}
