import { LayoutModule } from '@angular/cdk/layout';
import {
  provideHttpClient,
  withInterceptors,
  withLegacyInterceptors,
} from '@angular/common/http';
import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideRouter,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { reducer } from './app/+state';
import { AppComponent } from './app/app.component';
import { APP_ROUTES } from './app/app.routes';

import { environment } from './environments/environment';
import { authInterceptor } from './utils/auth.interceptor';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor]),
      withLegacyInterceptors()
    ),
    provideRouter(
      APP_ROUTES
      //  withPreloading(PreloadAllModules)
    ),
    provideStore(reducer),
    provideEffects([]),
    provideStoreDevtools(),
    provideAnimations(),
    importProvidersFrom(LayoutModule),
  ],
});
