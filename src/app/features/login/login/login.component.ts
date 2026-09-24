import { Component, inject } from '@angular/core';
import { LoginService } from '../../../core/auth/services/Login/login.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule,RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  spChars: string = '_';
  resMessage: string = '';
  isSpinner: boolean = false;
  private readonly _LoginService = inject(LoginService);
  private readonly _Router = inject(Router);
  private readonly _CookieService = inject(CookieService);
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
      this.resMessage = '';
      this._LoginService.SignIn(this.loginForm.value).subscribe({
        next: (res) => {
          this.isSpinner = false;
          this.resMessage = '';
          this._Router.navigate(['/feeds'])
          this._CookieService.set('token',res.data.token)          
        },
        error: (err) => {
          this.isSpinner = false;
          this.resMessage = err.error.message;
        },
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
