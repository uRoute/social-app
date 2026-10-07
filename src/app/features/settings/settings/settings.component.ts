import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { UserService } from '../../../shared/services/User/user.service';
import { IUser } from '../../../core/models/UserInfo/iuser.interface';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
  private _ThemeService = inject(ThemeService);
  private _UserService = inject(UserService);
  private _Router = inject(Router);
  resMsg: WritableSignal<string> = signal('');
  currentUser = this._UserService.userInfo();
  isDarkMode = this._ThemeService.isDarkMode;
  isSpinner: WritableSignal<boolean> = signal(false);


  changePasswordForm: FormGroup = new FormGroup({
    password: new FormControl(null, [
      Validators.required,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/),
    ]),
    newPassword: new FormControl(null, [
      Validators.required,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/),
    ])
  })


  userData: WritableSignal<IUser> = signal<IUser>({} as IUser);

  toggleTheme(): void {
    this._ThemeService.toggleTheme();
  }
  getUserData(): void {
    this._UserService.GetMyProfile().subscribe((res) => {
      // console.log(res);
      this.userData.set(res.data.user);
      console.log(this.userData());

    });
  }
  changePassword(form: HTMLFormElement) {
    this.isSpinner.set(true);
    if (this.changePasswordForm.valid) {
      console.log(this.changePasswordForm.value);
      this._UserService.ChangePassword(this.changePasswordForm.value).subscribe((res) => {
        console.log(res);
        this.isSpinner.set(false);
        this.changePasswordForm.reset();
        this._UserService.LogOut()
        this._Router.navigate(['/login'])
      }, (err) => {
        if (err.error.message === 'incorrect email or password') {
          this.resMsg.set("Wrong User's Previous Password");
        }
        this.isSpinner.set(false);
      })

    }

  }
  ngOnInit(): void {
    this.getUserData();
  }
}
