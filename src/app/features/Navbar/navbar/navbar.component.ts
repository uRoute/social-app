import { Component, effect, inject, input, OnInit, WritableSignal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { initFlowbite } from 'flowbite';
import { UserService } from '../../../shared/services/User/user.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  private _UserService = inject(UserService)

  isLogged = input<boolean>(false)

  constructor() {
    effect(() => {
      if (this.isLogged()) {
        setTimeout(() => {
          initFlowbite();
        }, 0);
      }
    });
  }

  ngOnInit(): void {
    if (this.isLogged()) {
      initFlowbite();
    }
  }
  signOut() {
    this._UserService.LogOut()
  }
}
