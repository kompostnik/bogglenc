import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { SplashService } from './splash.service';

@Injectable({
    providedIn: 'root'
})
export class AppInitializer {

    constructor(private authService: AuthService,
                private splashService: SplashService) {

    }

    initialize(): Promise<any> {
        return new Promise((resolve, reject) => {
            console.log('app initializing');

            this.splashService.initialize()
                .then(() => this.authService.initializeUser())
                .then(() => this.authService.initializeProfile())
                .then(() => this.splashService.destroy())
                .then(resolve);

        });
    }
}