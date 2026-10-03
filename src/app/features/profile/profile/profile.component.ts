import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { IUser } from '../../../core/models/UserInfo/iuser.interface';
import { UserService } from '../../../shared/services/User/user.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-profile',
  imports: [DatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private _UserService = inject(UserService)
  profileImage = './Images/default-profile.png';
  coverImage: string | null = null;
  user: WritableSignal<IUser> = signal({} as IUser)

  ngOnInit(): void {
    this._UserService.GetMyProfile().subscribe({
      next: (res) => {
        this.user.set(res.data.user)
      }
    })
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.profileImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.coverImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
}
