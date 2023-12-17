import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { GameService } from '../../services/game.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject, catchError, Subject, Subscription, throwError } from 'rxjs';
import { BackendService, CheckWordResult } from '../../services/backend.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';

@Component({
    selector: 'app-game',
    templateUrl: './game.component.html',
    styleUrls: ['./game.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameComponent implements OnInit, OnDestroy {

    gameState$ = new BehaviorSubject<GameState | undefined>(undefined);
    gameOverConditionInSeconds = GameService.GAME_END_CONDITION_IN_SECONDS;
    inProgress$ = new BehaviorSubject<boolean>(false);
    wordValid$ = new Subject<boolean>();
    wordLengthLimit = GameService.GAME_WORD_LENGTH_LIMIT;
    gameTick$ = new BehaviorSubject<number>(0);
    private timerInterval!: any;
    private inProgressSubscription!: Subscription;
    private gameTickSubscription!: Subscription;
    private gameStateSubscription!: Subscription;
    private userSubscription!: Subscription;

    constructor(public gameService: GameService,
                private modalService: BsModalService,
                private backendService: BackendService,
                private cdr: ChangeDetectorRef,
                private router: Router,
                public authService: AuthService,
                private analytics: AngularFireAnalytics) {
    }

    ngOnInit() {
        if (this.gameService.gameData?.game.assignedToPlayer) {
            this.gameState$.next(GameState.GAME_SUBMITTED);
        } else if (this.gameService.gameData?.game.endedAt) {
            this.gameState$.next(GameState.GAME_FINISHED);
        } else {
            this.gameState$.next(GameState.GAME_ACTIVE);

            // on 1 second interval, this observable will broadcast
            this.gameTickSubscription = this.gameTick$.subscribe(value => {
                this.gameService.gameData!.timerProgress += 1;
                this.gameService.persistGameData();
                if (this.gameService.gameData!.timerProgress >= this.gameOverConditionInSeconds) {
                    this.gameState$.next(GameState.GAME_FINISHING);
                    this.analytics.logEvent('game#game_over_time_limit' as any);
                }
                this.cdr.detectChanges();
            });
        }

        this.gameStateSubscription = this.gameState$.subscribe(gameState => {
            if (gameState === GameState.GAME_ACTIVE) {
                this.startTimer();
            } else if (gameState === GameState.WORD_IN_SUBMISSION) {
                this.pauseTimer();
            } else if (gameState === GameState.GAME_FINISHING) {
                this.pauseTimer();
                this.handleGameOverCondition();
            } else if (gameState === GameState.GAME_FINISHED) {
                this.pauseTimer();
                this.submitGame();
            }
        });


        this.userSubscription = this.authService.profile$.subscribe((value) => {

            if (this.gameState$.value === GameState.GAME_FINISHED && this.authService.accountComplete) {
                this.submitGame();
            }
        });
    }

    actionExitGame() {
        this.router.navigate([''], { skipLocationChange: true });
    }

    ngOnDestroy(): void {
        clearInterval(this.timerInterval);
        if (this.inProgressSubscription) {
            this.inProgressSubscription.unsubscribe();
        }
        if (this.gameTickSubscription) {
            this.gameTickSubscription.unsubscribe();
        }
        if (this.gameStateSubscription) {
            this.gameStateSubscription.unsubscribe();
        }
        if (this.userSubscription) {
            this.userSubscription.unsubscribe();
        }
    }

    handleWordSubmittedEvent(selectedLetterIndexes: number[]) {
        this.gameState$.next(GameState.WORD_IN_SUBMISSION);
        this.inProgress$.next(true);

        this.backendService.guessTheWord(this.gameService.gameData!.game.id, selectedLetterIndexes)
            .pipe(
                catchError(err => {
                    this.wordIncorrect();
                    console.log('Handling error locally and rethrowing it...', err);
                    return throwError(err);
                })
            )
            .subscribe((check: CheckWordResult) => {
                if (check.correct) {
                    this.wordCorrect(check);
                    this.analytics.logEvent('game#word_guessed' as any, { word: this.gameService.currentWord } as any);
                    this.analytics.logEvent('game#possible_words' as any, { words: check.game.possibleWords } as any);
                } else {
                    this.wordIncorrect();
                }
                this.gameService.gameData!.game = check.game;

                // server returns game with endedAt field if game is over
                if (check.game.endedAt) {
                    this.inProgress$.next(true);
                    this.gameState$.next(GameState.GAME_FINISHED);
                    this.analytics.logEvent('game#game_over_words_limit' as any);
                }
            });
    }

    private wordIncorrect() {
        this.cdr.detectChanges();
        this.gameService.missedWords?.push(this.gameService.currentWord);
        this.wordValid$.next(false);
        this.inProgress$.next(false);
        if(this.gameState$.value === GameState.WORD_IN_SUBMISSION) {
            this.gameState$.next(GameState.GAME_ACTIVE);
        }
    }

    private pauseTimer() {
        clearInterval(this.timerInterval);
    }

    private startTimer() {
        if (this.timerInterval) {
            this.pauseTimer();
        }

        this.timerInterval = setInterval(() => {
            this.gameTick$.next(this.gameService.gameData!.timerProgress);
        }, GameService.GAME_TIME_OUT_MILIS);
    }

    private handleGameOverCondition() {
        this.inProgress$.next(true);
        this.cdr.detectChanges();
        this.backendService.gameOver(this.gameService.gameData!.game.id)
            .pipe(
                catchError(err => {
                    console.log('Handling error locally and rethrowing it...', err);
                    return throwError(err);
                })
            )
            .subscribe(value => {
                this.gameService.gameData!.game = value;
                this.gameService.persistGameData();
                this.gameState$.next(GameState.GAME_FINISHED);
                this.cdr.detectChanges();
            });
    }

    private navigateToGameOverScreen() {
        this.router.navigate(['game-over'], { skipLocationChange: true });
    }

    private wordCorrect(check: CheckWordResult) {
        this.gameService.gameData!.timerProgress = Math.max(this.gameService.gameData!.timerProgress - this.gameService.timeBonusByWord(), 0);
        this.gameService.guessedWords?.push(this.gameService.currentWord);
        this.wordValid$.next(true);
        this.cdr.detectChanges();

        setTimeout(() => {
            // wait for animation to apply changes
            this.gameService.applyBackendGame(check.game);
            this.inProgress$.next(false);
            this.cdr.detectChanges();
            if(this.gameState$.value === GameState.WORD_IN_SUBMISSION) {
                this.gameState$.next(GameState.GAME_ACTIVE);
            }
        }, 700);
    }

    private submitGame() {
        if (this.gameService.gameData?.game.name) {
            this.gameState$.next(GameState.GAME_SUBMITTED);
            this.cdr.detectChanges();
        } else if (this.authService.accountComplete && this.authService.user!.uid && this.gameService.gameData!.game!.score > 0) {
            this.gameState$.next(GameState.GAME_SUBMITTING);
            this.backendService.assignGameToPlayer(this.gameService.gameData!.game!.id, this.authService.user!.uid)
                .subscribe(value => {
                    this.gameService.gameData!.game = value;
                    this.gameService.persistGameData();
                    this.gameState$.next(GameState.GAME_SUBMITTED);
                    this.cdr.detectChanges();
                });
        } else {
            this.gameState$.next(GameState.GAME_FINISHED_NO_SUBMIT)
        }
    }
}

export enum GameState {
    GAME_ACTIVE, WORD_IN_SUBMISSION, GAME_FINISHING, GAME_FINISHED, GAME_SUBMITTING, GAME_SUBMITTED, GAME_FINISHED_NO_SUBMIT
}
