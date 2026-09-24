import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoginService } from '../../../core/auth/services/Login/login.service';
import { RegisterService } from '../../../core/auth/services/Register/register.service';
import { Router, RouterLink } from '@angular/router';
@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  spChars: string = '_';
  resMessage: string = '';
  isSpinner: boolean = false;
  private readonly _RegisterService = inject(RegisterService);
  private readonly _Router = inject(Router);

  registerForm: FormGroup = new FormGroup(
    {
      name: new FormControl(null, [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern(/^[A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,}){0,3}$/),
      ]),
      username: new FormControl(null, [
        Validators.minLength(3),
        Validators.maxLength(15),
        Validators.pattern(/^[a-z0-9_]{3,15}$/),
      ]),
      email: new FormControl(null, [Validators.required, Validators.email]),
      dateOfBirth: new FormControl(null, [Validators.required]),
      gender: new FormControl(null, [Validators.required, Validators.pattern(/^(?:male|female)$/)]),
      password: new FormControl(null, [
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/),
      ]),
      rePassword: new FormControl(null, [
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/),
      ]),
    },
    { validators: this.confirmPassword },
  );
  confirmPassword(formGroup: AbstractControl) {
    return formGroup.get('password')?.value === formGroup.get('rePassword')?.value
      ? null
      : { missmatch: true };
  }
  submitRegisterForm() {
    if (this.registerForm.valid) {
      this.isSpinner = true;
      this.resMessage = '';
      this._RegisterService.SignUp(this.registerForm.value).subscribe({
        next: (res) => {
          this.resMessage = '';
          this.isSpinner = false;
          this._Router.navigate(['/login'])
        },
        error: (err) => {
          this.isSpinner = false;
          this.resMessage = err.error.message;
        },
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}
