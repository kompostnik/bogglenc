import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { GameService } from '../../services/game.service';
import { BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { Router } from '@angular/router';
import { AchievementsComponent } from '../../components/achievements/achievements.component';
import { AuthService } from '../../services/auth.service';
import { BehaviorSubject, catchError, Subscription, throwError } from 'rxjs';
import { BackendService, Game } from '../../services/backend.service';
import { AuthModalComponent, AuthModalState } from '../../components/auth-modal/auth-modal.component';

@Component({
    selector: 'app-game-over',
    templateUrl: './game-over.component.html',
    styleUrls: ['./game-over.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameOverComponent implements OnInit, OnDestroy {
    gameOverState$ = new BehaviorSubject<GameOverState | undefined>(undefined);
    games$ = new BehaviorSubject<Game[] | undefined>(undefined);
    gameOverStateSubscription!: Subscription;
    gamesSubscription!: Subscription;
    gameOverType!: GameOverType;
    protected readonly GameService = GameService;
    protected readonly GameOverState = GameOverState;
    protected readonly GameOverType = GameOverType;

    constructor(public gameService: GameService,
                private modalService: BsModalService,
                private router: Router,
                public authService: AuthService,
                private cdr: ChangeDetectorRef,
                private backendService: BackendService) {

    }

    actionOpenAchievementsModal() {
        this.modalService.show(AchievementsComponent, { class: 'modal-lg' });
    }

    assignGameToPlayer() {
        if (!this.gameService.gameData!.game.name) {

            this.backendService.assignGameToPlayer(this.gameService.gameData!.game.id, this.authService.user!.uid)
                .pipe(
                    catchError(err => {
                        console.log('Handling error locally and rethrowing it...', err);
                        return throwError(err);
                    })
                )
                .subscribe(value => {
                    this.gameService.leaderBoardFormSubject$.next(true);
                    this.gameService.gameData!.game.name = this.authService.profile!.name;
                    this.gameService.persistGameData();
                    this.gameOverState$.next(GameOverState.LOADING_GAMES);
                });
        }
    }

    ngOnInit(): void {
        if (this.authService.accountComplete && !this.gameService.gameData!.game.name) {
            this.gameOverState$.next(GameOverState.ASSIGNING_GAME_TO_PLAYER);
        } else {
            this.gameOverState$.next(GameOverState.LOADING_GAMES);
        }

        if (this.gameService!.guessedWords!.length >= GameService.GAME_WORDS_LIMIT) {
            this.gameOverType = GameOverType.WORDS_LIMIT;
        } else {
            this.gameOverType = GameOverType.TIME_LIMIT;
        }

        this.gameOverStateSubscription = this.gameOverState$.subscribe(state => {
            if (state === GameOverState.ASSIGNING_GAME_TO_PLAYER) {
                this.assignGameToPlayer();
            } else if (state === GameOverState.LOADING_GAMES) {
                this.fetchLeaderBoard();
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
                    if (this.authService.accountComplete) {
                        this.gameOverState$.next(GameOverState.ASSIGNING_GAME_TO_PLAYER);
                    }
                }
                this.cdr.detectChanges();
            });
        }
    }

    fetchLeaderBoard() {
        this.gamesSubscription = this.backendService.getLeaderBoard()
            .pipe(
                catchError(err => {
                    return throwError(err);
                })
            )
            .subscribe(games => {
                this.games$.next(games);
                this.gameOverState$.next(GameOverState.GAMES_LOADED)
                this.cdr.detectChanges();
            });
    }

    ngOnDestroy(): void {
        if (this.gameOverStateSubscription) {
            this.gameOverStateSubscription.unsubscribe();
        }
        if (this.gamesSubscription) {
            this.gamesSubscription.unsubscribe();
        }
    }
}

export enum GameOverState {
    ASSIGNING_GAME_TO_PLAYER,
    LOADING_GAMES,
    GAMES_LOADED
}

export enum GameOverType {
    WORDS_LIMIT, TIME_LIMIT
}
