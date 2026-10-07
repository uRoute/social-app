import { Component, computed, effect, inject, input, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { initFlowbite } from 'flowbite';
import { UserService } from '../../../shared/services/User/user.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  private _UserService = inject(UserService);
  private _ThemeService = inject(ThemeService);
  isLogged = input<boolean>(false);
  isDarkMode = this._ThemeService.isDarkMode;
  currentUserData = computed(() => this._UserService.userInfo());
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

  toggleTheme(): void {
    this._ThemeService.toggleTheme();
  }

  signOut() {
    this._UserService.LogOut();
  }
}

