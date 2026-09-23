import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../../features/Navbar/navbar/navbar.component';

@Component({
  selector: 'app-authlayout',
  imports: [RouterOutlet, NavbarComponent ,RouterLink , RouterLinkActive],
  templateUrl: './authlayout.component.html',
  styleUrl: './authlayout.component.css',
})
export class AuthlayoutComponent {}
