import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { GameData, GameService } from '../../services/game.service';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { MenuComponent } from '../../components/menu/menu.component';
import { catchError, Subject, throwError } from 'rxjs';
import { BackendService, Game } from '../../services/backend.service';
import { Router } from '@angular/router';
import { LeaderBoardModalComponent } from '../../components/leader-board-modal/leader-board-modal.component';
import { AuthService } from '../../services/auth.service';
import { AuthModalComponent } from '../../components/auth-modal/auth-modal.component';
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';
import { getAnalytics, logEvent } from '@angular/fire/analytics';

@Component({
    selector: 'app-main-menu',
    templateUrl: './main-menu.component.html',
    styleUrls: ['./main-menu.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainMenuComponent {

    inProgressActionNewGame$ = new Subject<boolean>();

    constructor(public gameService: GameService,
                private modalService: BsModalService,
                private backendService: BackendService,
                public authService: AuthService,
                private router: Router,
                private cdr: ChangeDetectorRef,
                private analytics: AngularFireAnalytics) {

    }

    get existingGame() {
        return this.gameService.gameData;
    }

    actionNewGame() {
        logEvent(getAnalytics(),'main_menu#new_game' as any);
        this.inProgressActionNewGame$.next(true);
        this.backendService.startGame()
            .pipe(
                catchError(err => {
                    this.inProgressActionNewGame$.next(false);
                    console.log('Handling error locally and rethrowing it...', err);
                    return throwError(err);
                })
            )
            .subscribe(game => {
                this.gameService.gameData = {
                    guessedWords: [],
                    missedWords: [],
                    timerProgress: 0,
                    game: {} as Game,
                    lettersBag: []
                } as GameData;
                this.gameService.applyBackendGame(game);
                this.gameService.gameData!.timerProgress = 0;
                this.gameService.persistGameData();
                this.router.navigate(['game'], { skipLocationChange: true });
                this.inProgressActionNewGame$.next(false);
            });
    }

    actionResumeGame() {
        if (this.existingGame) {
            logEvent(getAnalytics(),'main_menu#resume_game' as any);
            this.gameService.gameData = this.existingGame;
            this.router.navigate(['game'], { skipLocationChange: true });
        }
    }

    actionOpenMenu(): BsModalRef {
        logEvent(getAnalytics(),'main_menu#open_menu' as any)
        return this.modalService.show(MenuComponent);
    }

    actionLeaderBoard() {
        logEvent(getAnalytics(),'main_menu#leaderboard' as any);
        return this.modalService.show(LeaderBoardModalComponent);
    }

    actionGoToProfile() {
        if (!this.authService.isAuthenticated || this.authService.missingUsername) {
            const bsModalRef = this.modalService.show(AuthModalComponent, {
                initialState: {
                    infoText: 'Za dostop do profila in zgodovine iger se moraš prijavit. Izberi sredstvo za prijavo.'
                }
            } as ModalOptions);

            bsModalRef.onHide!.subscribe(value => {
                this.cdr.detectChanges();
            });
        } else {
            this.router.navigate(['profile', this.authService.profile?.name]);
        }
    }
}
