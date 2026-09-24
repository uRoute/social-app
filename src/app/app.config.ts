import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import {CookieService} from 'ngx-cookie-service';
import { routes } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes , withHashLocation() ,withViewTransitions() , withInMemoryScrolling({scrollPositionRestoration:'top' , anchorScrolling:'enabled'})),
    provideHttpClient(withFetch()),
    importProvidersFrom(CookieService)
  ]
};
