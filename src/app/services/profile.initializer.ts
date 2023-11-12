import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { BackendService } from './backend.service';
import { catchError, throwError } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ProfileInitializer {

    constructor(private authService: AuthService, private backendService: BackendService) {

    }

    initialize(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.authService.user$.subscribe(user => {
                if (user) {
                    this.backendService.readPlayerProfile(user.uid, undefined)
                        .pipe(catchError((err, caught) => {
                            resolve(true);
                            return throwError(err);
                        }))
                        .subscribe(value => {
                            this.authService.user!.name = value.nickname;
                            resolve(true);
                        });
                } else {
                    resolve(true);
                }
            });
        });
    }

}