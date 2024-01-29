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
import { BehaviorSubject, catchError, delay, Subscription, throwError } from 'rxjs';
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

    get afterUsernameButtonText() {
        if (this.redirect) {
            return 'Na profil';
        } else {
            return 'Zapri';
        }
    };

    get title(): string {
        if (this.authModalState$.value === AuthModalState.NO_AUTHENTICATION) {
            return 'Prijava';
        } else if (this.authModalState$.value === AuthModalState.MISSING_USERNAME) {
            return 'Zadnji korak';
        } else if (this.authModalState$.value === AuthModalState.AFTER_USERNAME) {
            return 'Profil ustvarjen';
        } else {
            return 'Prijava';
        }
    };

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
                    this.router.navigate(['profile', this.authService.profile?.name]);
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
        this.authService.logout();
    }


    /**
     * Check if user's username exists, if not prompt for one.
     */
    checkUsername() {
        this.inProgress$.next(true);
        const uid = this.authService.user?.uid;
        if (uid) {

            this.backendService.readPlayerProfile(uid, undefined)
                .pipe(
                    catchError((err: HttpErrorResponse, caught) => {
                        if (err.status === 404) {
                            this.authModalState$.next(AuthModalState.MISSING_USERNAME);
                        }

                        this.inProgress$.next(false);
                        return throwError(() => err);
                    })
                )
                .subscribe(value => {
                    if (!value) {
                        this.authModalState$.next(AuthModalState.MISSING_USERNAME);
                    } else {
                        this.authService.username = value.nickname
                        this.authModalState$.next(AuthModalState.COMPLETE);
                    }

                    this.inProgress$.next(false);
                });
        }
    }

    actionSubmitUsername() {
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
        this.backendService.submitPlayerProfile(this.authService.user!.uid, this.usernameInput)
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
            )
            .subscribe(value => {
                if (!value) {
                    this.usernameInputError = 'Uporabniško ime je že zasedeno';
                    this.cdr.detectChanges();
                } else {
                    this.authService.username = this.usernameInput;
                    this.authModalState$.next(AuthModalState.AFTER_USERNAME);
                }
                this.inProgressUsernameSubmit$.next(false);
            });
    }

    actionCloseAfterUsername() {
        this.authModalState$.next(AuthModalState.COMPLETE);
        if (this.redirect) {
            this.router.navigate(['profile', this.authService.profile?.name]);
            this.modalRef.hide();
        } else {
            this.modalRef.hide();
        }
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
    NO_AUTHENTICATION, MISSING_USERNAME, COMPLETE, AFTER_USERNAME
}