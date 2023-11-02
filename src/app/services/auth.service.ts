import { Injectable } from '@angular/core';
import { Auth, authState, User, user } from '@angular/fire/auth';
import { Observable } from 'rxjs';

/**
 * Inspired from
 * - https://medium.com/@ogun.ergin35/firebase-powered-authentication-in-angular-a-step-by-step-guide-196236c96ba6
 * - https://github.com/angular/angularfire/blob/master/docs/auth.md
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService {
    user: UserProfile | undefined;
    auth!: Auth;
    user$!: Observable<User | null>;

    constructor(private readonly _auth: Auth) {
        this.auth = _auth
        const authState$ = authState(this.auth);
        this.user$ = user(this.auth);
        this.user$.subscribe(value => {
            if (value) {
                this.user = { name: value?.displayName } as UserProfile;
            } else {
                this.user = undefined;
            }
        });
    }

    get isAuthenticated(): boolean {
        return this.user !== undefined;
    }

    logout() {
        this.auth.signOut()
            .then(() => {
                // Logout successful
            })
            .catch((error: any) => {
                // An error occurred
            });
    }

}

export class UserProfile {
    name!: string;
}