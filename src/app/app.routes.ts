import { Routes } from '@angular/router';
import { AuthlayoutComponent } from './layouts/Authlayout/authlayout/authlayout.component';
import { MainlayoutComponent } from './layouts/Mainlayout/mainlayout/mainlayout.component';

export const routes: Routes = [
    {path:'', redirectTo:'login' , pathMatch:'full' },
    {path:'' , component:AuthlayoutComponent , children:[
        {path:'login' , loadComponent: ()=> import('./features/login/login/login.component').then( (c)=>c.LoginComponent ), title:'Login'  },
        {path:'register' , loadComponent: ()=> import('./features/register/register/register.component').then( (c)=>c.RegisterComponent ) , title:'Register' }
    ]},
    {path:'' , component:MainlayoutComponent , children:[
        {path:'feeds' , loadComponent: ()=> import('./features/feed/feed/feed.component').then( (c)=>c.FeedComponent ), title:'Feeds | main page'  },
        {path:'profile' , loadComponent: ()=> import('./features/profile/profile/profile.component').then( (c)=>c.ProfileComponent ), title:'Profile'  },
        {path:'notifications' , loadComponent: ()=> import('./features/notifications/notifications/notifications.component').then( (c)=>c.NotificationsComponent ), title:'Notifications'  }
    ]},
    {path:'**' , loadComponent: ()=> import('./features/wildCard/wild-card/wild-card.component').then( (c)=>c.WildCardComponent ) , title:'Not found '  }

];
