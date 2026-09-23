import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../../features/Navbar/navbar/navbar.component';

@Component({
  selector: 'app-mainlayout',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './mainlayout.component.html',
  styleUrl: './mainlayout.component.css',
})
export class MainlayoutComponent {}
