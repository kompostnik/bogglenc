import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, catchError, Subscription, throwError } from 'rxjs';
import { AuthService, UserProfile } from '../../services/auth.service';
import { BackendService, Game } from '../../services/backend.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';
import { getAnalytics, logEvent } from '@angular/fire/analytics';

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
    private leaderboardSubscription!: Subscription;

    constructor(public authService: AuthService,
                private route: ActivatedRoute,
                private router: Router,
                private modalService: BsModalService,
                public backendService: BackendService,
                private cdr: ChangeDetectorRef,
                private analytics: AngularFireAnalytics) {}

    ngOnInit(): void {
        this.inProgress$.next(true);
        this.profileId = this.route.snapshot.paramMap.get('id');
        if (!this.profileId && this.authService.accountComplete) {
            this.router.navigate(['profile', this.authService.profile!.name]);
        } else {
            this.myProfile = this.authService.isAuthenticated && this.profileId === this.authService.profile?.name;
            this.loadUserProfile();
        }
        logEvent(getAnalytics(),'profile' as any, { profileId: this.profileId } as any);
    }

    actionLogout() {
        this.userProfile = undefined;
        this.userSubscription = this.authService.user$.subscribe(value => {
            if (!value) {
                this.cdr.detectChanges();
                setTimeout(() => this.router.navigate(['']));
            }
        });
        this.authService.logout();
    }

    ngOnDestroy(): void {
        if (this.userSubscription) {
            this.userSubscription.unsubscribe();
        }
        if (this.logoutSubscription) {
            this.logoutSubscription.unsubscribe();
        }
        if (this.leaderboardSubscription) {
            this.leaderboardSubscription.unsubscribe();
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
            this.leaderboardSubscription = this.backendService.getPlayerLeaderboard(this.profileId)
                .pipe(
                    catchError(err => {
                        console.log('Handling error locally and rethrowing it...', err);
                        this.inProgress$.next(false);
                        this.cdr.detectChanges();
                        return throwError(err);
                    })
                )
                .subscribe(data => {
                    this.games = data;
                    this.inProgress$.next(false);
                    this.cdr.detectChanges();
                });
        }
    }
}
