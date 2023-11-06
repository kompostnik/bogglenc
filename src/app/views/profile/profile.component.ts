import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, catchError, Subscription, throwError } from 'rxjs';
import { AuthService, UserProfile } from '../../services/auth.service';
import { BackendService, Game } from '../../services/backend.service';
import { BsModalService } from 'ngx-bootstrap/modal';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit, OnDestroy {

    userProfile!: UserProfile | undefined;
    profileId?: string | null | undefined;
    inProgress$ = new BehaviorSubject<boolean>(false);
    games: Game[] = [];
    myProfile: boolean = false;
    private userSubscription!: Subscription;
    private logoutSubscription!: Subscription;

    constructor(public authService: AuthService,
                private route: ActivatedRoute,
                private router: Router,
                private modalService: BsModalService,
                public backendService: BackendService,
                private cdr: ChangeDetectorRef) {}

    ngOnInit(): void {
        this.inProgress$.next(true);
        this.profileId = this.route.snapshot.paramMap.get('id');
        if (!this.profileId && this.authService.accountComplete) {
            this.router.navigate(['profile', this.authService.user!.name]);
        } else {
            this.myProfile = this.authService.isAuthenticated && this.profileId === this.authService.user?.name;
            this.loadUserProfile();
        }
    }

    uiActionLogout() {
        this.userProfile = undefined;
        this.userSubscription = this.authService.user$.subscribe(value => {
            if (!value) {
                this.cdr.detectChanges();
                setTimeout(() => this.router.navigate(['']));
            }
        });
        this.logoutSubscription = this.authService.logout().subscribe();
    }

    ngOnDestroy(): void {
        if (this.userSubscription) {
            this.userSubscription.unsubscribe();
        }
        if (this.logoutSubscription) {
            this.logoutSubscription.unsubscribe();
        }
    }

    private loadUserProfile() {
        this.backendService.readPlayerProfile(null, this.profileId)
            .subscribe(value => {
                this.userProfile = {
                    name: value.nickname
                } as UserProfile;

                this.fetchLeaderBoard();
            });
    }

    private fetchLeaderBoard() {
        if (this.profileId) {
            this.backendService.getPlayerLeaderboard(this.profileId)
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
                        return game.name === this.authService.user?.name;
                    }) as any[];
                    this.inProgress$.next(false);
                    this.cdr.detectChanges();
                });
        } else {

        }
    }
}
