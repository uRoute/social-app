import { Component, inject } from '@angular/core';
import { LoginService } from '../../../core/auth/services/Login/login.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  spChars: string = '_';
  resMessage: string = '';
  isSpinner: boolean = false;
  private readonly _LoginService = inject(LoginService);

  loginForm: FormGroup = new FormGroup({
    email: new FormControl(null, [Validators.required, Validators.email]),
    password: new FormControl(null, [
      Validators.required,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/),
    ]),
  });

  login() {
    if (this.loginForm.valid) {
      this.isSpinner = true;
      console.log(this.loginForm);
      this.resMessage = '';
      this._LoginService.SignIn(this.loginForm.value).subscribe({
        next: (res) => {
          console.log(res);
          this.isSpinner = false;
          this.resMessage = '';
        },
        error: (err) => {
          this.isSpinner = false;
          console.log(err);
          this.resMessage = err.error.message;
        },
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
