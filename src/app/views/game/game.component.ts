import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { GameService } from '../../services/game.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject, catchError, Subject, Subscription, throwError } from 'rxjs';
import { BackendService, CheckWordResult } from '../../services/backend.service';
import { Router } from '@angular/router';

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

    constructor(public gameService: GameService,
                private modalService: BsModalService,
                private backendService: BackendService,
                private cdr: ChangeDetectorRef,
                private router: Router) {
    }

    ngOnInit() {
        if (this.gameService.gameData?.game.endedAt) {
            // when resuming previous game, which already ended, just navigate to 'game-over'
            this.navigateToGameOverScreen();
            return;
        } else {
            this.gameState$.next(GameState.GAME_ACTIVE);
        }

        this.gameStateSubscription = this.gameState$.subscribe(gameState => {
            if (gameState === GameState.GAME_ACTIVE) {
                this.startTimer();
            } else if (gameState === GameState.WORD_IN_SUBMISSION) {
                this.pauseTimer();
            } else if(gameState === GameState.GAME_OVER){
                this.handleGameOverCondition();
            }
        });

        // on 1 second interval, this observable will broadcast
        this.gameTickSubscription = this.gameTick$.subscribe(value => {
            this.gameService.gameData!.timerProgress += 1;
            this.gameService.persistGameData();
            if (this.gameService.gameData!.timerProgress >= this.gameOverConditionInSeconds) {
                this.gameState$.next(GameState.GAME_OVER);
            }
            this.cdr.detectChanges();
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
                } else {
                    this.wordIncorrect();
                }
                this.gameService.gameData!.game = check.game;

                // server returns game with endedAt field if game is over
                if (check.game.endedAt) {
                    this.inProgress$.next(true);
                    this.gameState$.next(GameState.GAME_OVER);
                }
            });
    }

    private wordIncorrect() {
        this.cdr.detectChanges();
        this.gameService.missedWords?.push(this.gameService.currentWord);
        this.wordValid$.next(false);
        this.inProgress$.next(false);
        this.gameState$.next(GameState.GAME_ACTIVE);
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
                this.navigateToGameOverScreen();
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
            this.gameState$.next(GameState.GAME_ACTIVE);
        }, 700);
    }
}

export enum GameState {
    GAME_ACTIVE, WORD_IN_SUBMISSION, GAME_OVER
}
