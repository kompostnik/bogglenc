import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, UserProfile } from '../../services/auth.service';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {

    userProfile!: UserProfile | undefined;
    profileId?: string | null;
    inProgress: boolean = false;
    private userSubscription!: Subscription;

    constructor(public authService: AuthService, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {}

    ngOnInit(): void {
        this.inProgress = true;
        this.profileId = this.route.snapshot.paramMap.get('id');
        if (this.profileId) {
            // fetch profile
            this.loadOtherUserProfile();
        } else {
            this.loadCurrentUserProfile();
        }
    }

    actionLogout() {
        this.userProfile = undefined;
        this.authService.logout();
    }

    ngOnDestroy(): void {
        this.userSubscription.unsubscribe();
    }

    private loadOtherUserProfile() {
        this.inProgress = false;
    }

    private loadCurrentUserProfile() {
        this.userSubscription = this.authService.user$.subscribe(value => {
            if (this.authService.isAuthenticated) {
                this.userProfile = { name: this.authService.user?.name } as UserProfile;
            }
            this.inProgress = false;
            this.cdr.detectChanges();
        });
    }

}
