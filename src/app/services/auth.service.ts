import { Injectable } from '@angular/core';
import { Auth, User, user } from '@angular/fire/auth';
import { BehaviorSubject, catchError, map, Observable, throwError } from 'rxjs';
import { BackendService } from './backend.service';

/**
 * Inspired from
 * - https://medium.com/@ogun.ergin35/firebase-powered-authentication-in-angular-a-step-by-step-guide-196236c96ba6
 * - https://github.com/angular/angularfire/blob/master/docs/auth.md
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService {
    constructor(private readonly auth: Auth, private backendService: BackendService) {

    }

    private _user$: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
    private _profile$: BehaviorSubject<UserProfile | null> = new BehaviorSubject<UserProfile | null>(null);

    get user$(): Observable<User | null> {
        return this._user$.asObservable();
    }
    get profile$(): Observable<UserProfile | null> {
        return this._profile$.asObservable();
    }

    get isAuthenticated(): boolean {
        return this._user$.value !== null;
    }

    get missingUsername(): boolean {
        return !this._profile$.value?.name;
    }

    get user() {
        return this._user$.value;
    }
    get profile() {
        return this._profile$.value;
    }

    set username(name: string){
        this._profile$.next({
            uid: this._user$.value!.uid,
            name: name
        } as UserProfile)
    }

    get accountComplete(): boolean {
        return this.isAuthenticated && !this.missingUsername;
    }

    initializeUser(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            
            user(this.auth)
                .pipe(
                    map(fireUser => {
                        if (fireUser) {
                            this._user$.next(fireUser);
                        } else {
                            this._user$.next(null);
                            this._profile$.next(null);
                        }
                    }),
                    catchError((err, caught) => {
                        
                        resolve(true);
                        return throwError(err);
                    })
                )
                .subscribe(value => {
                    
                    resolve(true);
                });
        });
    }

    initializeProfile(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if(this._user$.value){
                this.backendService.readPlayerProfile(this._user$.value!.uid, undefined)
                    .pipe(
                        catchError((err, caught) => {
                            resolve(true)
                            return throwError(err);
                        })
                    )
                    .subscribe(value => {
                        this.username = value.nickname;
                        resolve(true)
                    });
            } else {
                resolve(true)
            }
        });
    }

    async logout() {
        return await this.auth.signOut();
    }
}

export interface UserProfile {
    name: string | null;
    uid: string;
}