import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, catchError, delay, Observable, of, Subscription, throwError } from 'rxjs';
import { AuthService, UserProfile } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { BackendService, Game } from '../../services/backend.service';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit, OnDestroy {

    userProfile!: UserProfile | undefined;
    profileId?: string | null;
    inProgress$ = new BehaviorSubject<boolean>(false);
    inProgressUsernameSubmit$ = new BehaviorSubject<boolean>(false);
    showUsernameForm: boolean = false;
    usernameInput!: string;
    private userSubscription!: Subscription;
    usernameInputError!: string | undefined;
    games: Game[] = [];

    constructor(public authService: AuthService,
                private route: ActivatedRoute,
                private router: Router,
                public backendService: BackendService,
                private cdr: ChangeDetectorRef) {}

    ngOnInit(): void {
        this.inProgress$.next(true);
        this.profileId = this.route.snapshot.paramMap.get('id');
        if (this.profileId) {
            // fetch profile
            this.loadOtherUserProfile();
        } else {
            this.loadCurrentUserProfile();
        }
    }

    uiActionLogout() {
        this.userProfile = undefined;
        this.authService.logout();
        this.router.navigate(['']);
    }

    ngOnDestroy(): void {
        if (this.userSubscription) {
            this.userSubscription.unsubscribe();
        }
    }

    /**
     * Check if user's username exists, if not prompt for one.
     */
    checkUsername() {
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
                            this.showUsernameForm = true;
                        }

                        this.inProgress$.next(false);
                        this.cdr.detectChanges()
                        return throwError(() => err);
                    })
                );

            checkBackendForUsername.subscribe(value => {
                if (value.status === 404) {
                    this.showUsernameForm = true;
                }

                this.inProgress$.next(false);
                this.cdr.detectChanges()
            });
        }
    }

    uiActionSubmitUsername() {
        const maxLength = 16;
        this.usernameInputError = undefined;
        if(!this.usernameInput || this.usernameInput.trim().length < 1){
            this.usernameInputError = 'Polje je obvezno';
        } else if(this.usernameInput.length > maxLength) {
            this.usernameInputError = `Polje ne sme presegati ${maxLength} znakov`;
        }

        if(this.usernameInputError){
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
                        this.cdr.detectChanges()
                    }
                    this.inProgressUsernameSubmit$.next(false);
                    return throwError(() => err);
                })
            );

        checkBackendForUsername.subscribe(value => {
            if (value.status === 409) {
                this.usernameInputError = 'Uporabniško ime je že zasedeno';
                this.cdr.detectChanges()
            } else {
                this.authService.user!.name = this.usernameInput;
                this.showUsernameForm = false;
                this.loadCurrentUserProfile()
            }
            this.inProgressUsernameSubmit$.next(false);
        });
    }

    private loadOtherUserProfile() {
        this.inProgress$.next(false);
    }

    private loadCurrentUserProfile() {
        if (this.authService.isAuthenticated) {
            if(!this.authService.user?.name){
                this.checkUsername();
            } else {
                this.userProfile = JSON.parse(JSON.stringify(this.authService.user)) as UserProfile;
                this.fetchLeaderBoard()
            }
        } else {
            this.inProgress$.next(false);
            this.cdr.detectChanges();
        }
    }

    private fetchLeaderBoard() {
        this.backendService.getLeaderBoard()
            .pipe(
                catchError(err => {
                    console.log('Handling error locally and rethrowing it...', err);
                    this.inProgress$.next(false);
                    this.cdr.detectChanges();
                    return throwError(err);
                })
            )
            .subscribe(data => {
                this.games = data.filter(game => {
                    return game.name === this.authService.user?.name
                }) as any[];
                this.inProgress$.next(false);
                this.cdr.detectChanges();
            })
    }

    calculateWordScore(s: string) : string{
        return 'todo'
    }
}
