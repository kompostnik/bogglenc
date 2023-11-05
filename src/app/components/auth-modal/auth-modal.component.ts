import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    ViewChild
} from '@angular/core';
import { authState, getAuth } from '@angular/fire/auth';
import { BehaviorSubject, catchError, delay, Observable, of, Subscription, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BackendService } from '../../services/backend.service';

@Component({
    selector: 'app-auth-modal',
    templateUrl: './auth-modal.component.html',
    styleUrls: ['./auth-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthModalComponent implements OnDestroy, OnInit {
    auth = getAuth();
    authState$ = authState(this.auth);
    authStateSubscription!: Subscription;
    infoText!: string;
    usernameInput!: string;
    usernameInputError!: string | undefined;
    inProgressUsernameSubmit$ = new BehaviorSubject<boolean>(false);
    inProgress$ = new BehaviorSubject<boolean>(false);
    authModalState$ = new BehaviorSubject<AuthModalState | undefined>(undefined);
    redirect: string | undefined = 'profile';
    @ViewChild('usernameInputElementRef')
    usernameInputElementRef!: ElementRef;
    protected readonly AuthModalState = AuthModalState;
    private userSubscription!: Subscription;
    private logoutSubscription!: Subscription;

    constructor(public authService: AuthService,
                private route: ActivatedRoute,
                private router: Router,
                public backendService: BackendService,
                private cdr: ChangeDetectorRef,
                public modalRef: BsModalRef) {
    }

    ngOnDestroy(): void {
        if (this.authStateSubscription) {
            this.authStateSubscription.unsubscribe();
        }
        if (this.userSubscription) {
            this.userSubscription.unsubscribe();
        }
        if (this.logoutSubscription) {
            this.logoutSubscription.unsubscribe();
        }
    }

    ngOnInit(): void {
        if (this.authService.isAuthenticated && this.authService.missingUsername) {
            this.authModalState$.next(AuthModalState.MISSING_USERNAME);
        } else if (this.authService.isAuthenticated) {
            this.authModalState$.next(AuthModalState.COMPLETE);
        } else if (!this.authService.isAuthenticated) {
            this.authModalState$.next(AuthModalState.NO_AUTHENTICATION);
        }


        this.authModalState$.subscribe(state => {
            if (state === AuthModalState.NO_AUTHENTICATION) {
                this.authStateSubscriptionInit();
            } else if (state === AuthModalState.MISSING_USERNAME) {
                setTimeout(() => this.usernameInputElementRef.nativeElement.focus());
            } else if (state === AuthModalState.COMPLETE) {
                if (this.redirect) {
                    console.log('User is authenticated redirect to profile view.');
                    this.router.navigate(['profile']);
                }
                this.modalRef.hide();
            }
        });
    }


    actionLogout() {
        this.userSubscription = this.authService.user$.subscribe(value => {
            if (!value) {
                this.modalRef.hide();
                this.cdr.detectChanges();
            }
        });
        this.logoutSubscription = this.authService.logout().subscribe();
    }


    /**
     * Check if user's username exists, if not prompt for one.
     */
    checkUsername() {
        this.inProgress$.next(true);
        const uid = this.authService.user?.uid;
        if (this.authService.user?.uid) {
            const checkBackendForUsername: Observable<Response> = of(
                {
                    status: 404
                } as Response)
                .pipe(
                    delay(500),
                    catchError((err: HttpErrorResponse, caught) => {
                        if (err.status === 404) {
                            this.authModalState$.next(AuthModalState.MISSING_USERNAME);
                        }

                        this.inProgress$.next(false);
                        this.cdr.detectChanges();
                        return throwError(() => err);
                    })
                );

            checkBackendForUsername.subscribe(value => {
                if (value.status === 404) {
                    this.authModalState$.next(AuthModalState.MISSING_USERNAME);
                }

                this.inProgress$.next(false);
                this.cdr.detectChanges();
            });
        }
    }

    uiActionSubmitUsername() {
        const maxLength = 16;
        this.usernameInputError = undefined;
        if (!this.usernameInput || this.usernameInput.trim().length < 1) {
            this.usernameInputError = 'Polje je obvezno';
        } else if (this.usernameInput.length > maxLength) {
            this.usernameInputError = `Polje ne sme presegati ${maxLength} znakov`;
        }

        if (this.usernameInputError) {
            return;
        }

        this.inProgressUsernameSubmit$.next(true);
        const checkBackendForUsername: Observable<Response> = of(
            {
                status: this.usernameInput === '409' ? 409 : 200
            } as Response)
            .pipe(
                delay(500),
                catchError((err: HttpErrorResponse, caught) => {
                    if (err.status === 409) {
                        this.usernameInputError = 'Uporabniško ime je že zasedeno';
                        this.cdr.detectChanges();
                    }
                    this.inProgressUsernameSubmit$.next(false);
                    return throwError(() => err);
                })
            );

        checkBackendForUsername.subscribe(value => {
            if (value.status === 409) {
                this.usernameInputError = 'Uporabniško ime je že zasedeno';
                this.cdr.detectChanges();
            } else {
                this.authService.user!.name = this.usernameInput;
                this.authModalState$.next(AuthModalState.COMPLETE);
            }
            this.inProgressUsernameSubmit$.next(false);
        });
    }

    private authStateSubscriptionInit() {
        this.authStateSubscription = this.authState$.subscribe((aUser) => {
            //handle auth state changes here. Note, that user will be null if there is no currently logged in user.
            if (aUser) {
                this.checkUsername();
            }
        });
    }
}

export enum AuthModalState {
    NO_AUTHENTICATION, MISSING_USERNAME, COMPLETE
}