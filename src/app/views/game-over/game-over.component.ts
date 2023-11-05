import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { GameService } from '../../services/game.service';
import { BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { Router } from '@angular/router';
import { AchievementsComponent } from '../../components/achievements/achievements.component';
import { AuthService } from '../../services/auth.service';
import { BehaviorSubject, catchError, throwError } from 'rxjs';
import { BackendService } from '../../services/backend.service';
import { AuthModalComponent, AuthModalState } from '../../components/auth-modal/auth-modal.component';

@Component({
    selector: 'app-game-over',
    templateUrl: './game-over.component.html',
    styleUrls: ['./game-over.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameOverComponent implements OnInit {
    gameOverState$ = new BehaviorSubject<GameOverState | undefined>(undefined);
    inProgress$ = new BehaviorSubject<boolean>(false);
    protected readonly GameService = GameService;
    protected readonly GameOverState = GameOverState;

    constructor(public gameService: GameService,
                private modalService: BsModalService,
                private router: Router,
                public authService: AuthService,
                private backendService: BackendService) {

    }

    get enteredToLeaderBoard(): boolean {
        if (!this.gameService.gameData!.game!.leaderboardRank) {
            return false;
        }
        const rankInLimit = this.gameService.gameData!.game!.leaderboardRank > 0 && this.gameService.gameData!.game!.leaderboardRank < 50;
        return rankInLimit && this.gameService.score! > 0;
    }

    get endByWordCount(): boolean {
        return this.gameService!.guessedWords!.length >= GameService.GAME_WORDS_LIMIT;
    }

    actionOpenAchievementsModal() {
        this.modalService.show(AchievementsComponent, { class: 'modal-lg' });
    }

    submitScoreToLeaderboard() {
        if (!this.gameService.gameData!.game.assignedToPlayer) {
            this.inProgress$.next(true);
            this.backendService.assignGameToPlayer(this.gameService.gameData!.game.id, this.authService.user!.uid)
                .pipe(
                    catchError(err => {
                        this.inProgress$.next(false);
                        console.log('Handling error locally and rethrowing it...', err);
                        return throwError(err);
                    })
                )
                .subscribe(value => {
                    this.inProgress$.next(false);
                    this.gameService.leaderBoardFormSubject$.next(true);
                    this.gameService.gameData!.game.name = this.authService.user!.name;
                    this.gameService.persistGameData();
                    this.gameOverState$.next(GameOverState.ENTERED_LEADERBOARD_AND_SUBMITTED);
                });
        }

    }

    ngOnInit(): void {
        if (this.gameService.gameData!.game.assignedToPlayer) {
            this.gameOverState$.next(GameOverState.ENTERED_LEADERBOARD_AND_SUBMITTED);
        } else if (this.gameService.gameData!.game.leaderboardRank) {
            if (this.authService.accountComplete) {
                this.gameOverState$.next(GameOverState.ENTERED_LEADERBOARD_PENDING_SUBMISSION);
            } else {
                this.gameOverState$.next(GameOverState.ENTERED_LEADERBOARD_BUT_ACCOUNT_MISSING);
            }
        } else {
            this.gameOverState$.next(GameOverState.NOT_ENTERED_LEADERBOARD);
        }

        this.gameOverState$.subscribe(state => {
            console.log('gameOverState$', state)
            if (state === GameOverState.ENTERED_LEADERBOARD_PENDING_SUBMISSION) {
                this.submitScoreToLeaderboard();
            }
        });
    }

    actionOpenAuthModal() {
        if (!this.authService.isAuthenticated || this.authService.missingUsername) {
            const bsModalRef = this.modalService.show(AuthModalComponent, {
                initialState: {
                    infoText: 'Za vpis med zmagovalce se moraš prijavit.',
                    redirect: undefined
                }
            } as ModalOptions);

            bsModalRef.content!.authModalState$!.subscribe((state: AuthModalState | undefined) => {
                if (state === AuthModalState.COMPLETE) {
                    this.gameOverState$.next(GameOverState.ENTERED_LEADERBOARD_PENDING_SUBMISSION);
                }
            });
        }
    }
}

export enum GameOverState {
    ENTERED_LEADERBOARD_PENDING_SUBMISSION,
    ENTERED_LEADERBOARD_AND_SUBMITTED,
    ENTERED_LEADERBOARD_BUT_ACCOUNT_MISSING,
    NOT_ENTERED_LEADERBOARD
}
