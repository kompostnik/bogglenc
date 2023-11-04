import { Component, OnDestroy, OnInit } from '@angular/core';

import { AuthService } from '../../services/auth.service';
import { authState, getAuth } from '@angular/fire/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-auth',
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnDestroy, OnInit {
    auth = getAuth();
    authState$ = authState(this.auth);
    authStateSubscription!: Subscription;
    private redirect = 'profile';

    constructor(public authService: AuthService,
                private router: Router,
                private route: ActivatedRoute) {

    }

    ngOnDestroy(): void {
        // this.authInstance.delete();
        this.authStateSubscription.unsubscribe();
    }

    ngOnInit(): void {
        this.authStateSubscriptionInit();
        this.redirect = this.route.snapshot.paramMap.get('redirect') ?? this.redirect;
    }

    private authStateSubscriptionInit() {
        this.authStateSubscription = this.authState$.subscribe((aUser) => {
            //handle auth state changes here. Note, that user will be null if there is no currently logged in user.
            if (aUser) {
                this.handleSignedInUser();
            }
        });
    }

    private handleSignedInUser() {
        this.router.navigate([this.redirect]);
    }
}
