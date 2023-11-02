import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';

import { AuthService, UserProfile } from '../../services/auth.service';
import { authState, EmailAuthProvider, getAuth } from '@angular/fire/auth';
import * as firebaseui from 'firebaseui';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { document } from 'ngx-bootstrap/utils';

@Component({
    selector: 'app-auth',
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements AfterViewInit, OnDestroy, OnInit {
    private authInstance!: firebaseui.auth.AuthUI;

    auth = getAuth();
    authState$ = authState(this.auth);
    authStateSubscription!: Subscription;


    constructor(public authService: AuthService,
                private router: Router) {

    }

    ngAfterViewInit() {
        try {
            this.authInstance = new firebaseui.auth.AuthUI(this.auth);
            this.authInstance.start('#firebaseui-auth-container', this.getUiConfig());
        } catch (e) {
            console.error(e)
        }
    }

    private getUiConfig(): firebaseui.auth.Config {
        const router = this.router;
        const that = this;
        return {
            callbacks: {
                'signInSuccessWithAuthResult': function(authResult, redirectUrl) {
                    if (authResult.user) {
                        that.handleSignedInUser();
                    }
                    if (authResult.additionalUserInfo) {
                        if(document) {
                            document.getElementById('is-new-user').textContent =
                                authResult.additionalUserInfo.isNewUser ?
                                    'New User' : 'Existing User';
                        }
                    }
                    // Do not redirect.
                    return false;
                }
            },
            signInOptions: [
                {
                    provider: EmailAuthProvider.PROVIDER_ID,
                    // Whether the display name should be displayed in Sign Up page.
                    requireDisplayName: true,
                    signInMethod: 'password',
                    disableSignUp: {
                        status: false
                    }
                },
            ]
        };
    }

    private handleSignedInUser() {
            this.router.navigate(['profile']);
    }

    ngOnDestroy(): void {
        this.authInstance.delete();
        this.authStateSubscription.unsubscribe();
    }

    ngOnInit(): void {
        this.authStateSubscription = this.authState$.subscribe((aUser) => {
            //handle auth state changes here. Note, that user will be null if there is no currently logged in user.
            console.log('===================-----STATE------=================');
            // console.log(aUser);
            if(aUser) {
                this.authService.user = {
                    name: aUser?.displayName
                } as UserProfile;
            }
        })
    }
}
