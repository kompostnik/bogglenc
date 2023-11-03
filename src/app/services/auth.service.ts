import { Injectable } from '@angular/core';
import { Auth, User, user } from '@angular/fire/auth';
import { map, Observable } from 'rxjs';
import { minidenticon } from 'minidenticons';

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
        this.auth = _auth;
        this.user$ = user(this.auth).pipe(map(fireUser => {
            console.log('user change', fireUser);
            this.user = this.fireUserToUserProfile(fireUser);
            return fireUser;
        }));
    }

    get isAuthenticated(): boolean {
        return this.user !== undefined;
    }

    get userAvatarSrc():string{
        return 'data:image/svg+xml;utf8,' + this.user?.avatarSrc;
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

    /**
     * Map Fire User to Bogglenc UserProfile
     * @param user
     * @private
     */
    private fireUserToUserProfile(user: User | null) {
        if (!user) {
            return undefined;
        }

        return {
            uid: user.uid,
            avatarSrc: encodeURIComponent(minidenticon(user!.uid))
        } as UserProfile;
    }
}

export class UserProfile {
    name!: string;
    uid!: string;
    avatarSrc!: string;
}