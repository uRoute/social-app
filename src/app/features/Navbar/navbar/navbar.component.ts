import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { initFlowbite } from 'flowbite';
import { UserService } from '../../../shared/services/User/user.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink , RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  private _UserService = inject(UserService)
  ngOnInit(): void {
          initFlowbite();
  }
  signOut(){
    this._UserService.LogOut()
  }
}
