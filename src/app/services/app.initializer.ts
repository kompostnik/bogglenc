import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { SplashService } from './splash.service';
import { ProfileInitializer } from './profile.initializer';

@Injectable({
    providedIn: 'root'
})
export class AppInitializer {

    constructor(private authService: AuthService,
                private splashService: SplashService,
                private profileInitializer: ProfileInitializer) {

    }

    initialize(): Promise<any> {
        return new Promise((resolve, reject) => {
            console.log('app initializing');

            this.splashService.initialize()
                .then(() => this.authService.initialize())
                .then(() => this.profileInitializer.initialize())
                .then(() => this.splashService.destroy())
                .then(resolve);

        });
    }
}