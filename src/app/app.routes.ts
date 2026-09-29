import { Routes } from '@angular/router';
import { AuthlayoutComponent } from './layouts/Authlayout/authlayout/authlayout.component';
import { MainlayoutComponent } from './layouts/Mainlayout/mainlayout/mainlayout.component';
import { authGuard } from './core/guard/Auth/auth-guard';

export const routes: Routes = [
    {path:'', redirectTo:'login' , pathMatch:'full' },
    {path:'' , component:AuthlayoutComponent  , children:[
        {path:'login' , loadComponent: ()=> import('./features/login/login/login.component').then( (c)=>c.LoginComponent ), title:'Social-app | Login'  },
        {path:'register' , loadComponent: ()=> import('./features/register/register/register.component').then( (c)=>c.RegisterComponent ) , title:'Social-app | Register' }
    ]},
    {path:'' , component:MainlayoutComponent , canActivate:[authGuard], children:[
        {path:'feeds'  , loadComponent: ()=> import('./features/feed/feed/feed.component').then( (c)=>c.FeedComponent ), title:'Social-app | Feeds'  },
        {path:'profile' , loadComponent: ()=> import('./features/profile/profile/profile.component').then( (c)=>c.ProfileComponent ), title:'Social-app | Profile'  },
        {path:'notifications' , loadComponent: ()=> import('./features/notifications/notifications/notifications.component').then( (c)=>c.NotificationsComponent ), title:'Social-app | Notifications'  },
        {path:'settings' , loadComponent: ()=> import('./features/settings/settings/settings.component').then( (c)=>c.SettingsComponent ), title:'Social-app | Settings'  }
    ]},
    {path:'**' , loadComponent: ()=> import('./features/wildCard/wild-card/wild-card.component').then( (c)=>c.WildCardComponent ) , title:'Social-app | Not found'  }

];
