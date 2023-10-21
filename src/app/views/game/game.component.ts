import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { GameService } from '../../services/game.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject, catchError, Subject, throwError } from 'rxjs';
import { BackendService, CheckWordResult } from '../../services/backend.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-game',
    templateUrl: './game.component.html',
    styleUrls: ['./game.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameComponent implements OnInit, OnDestroy {

    inProgress$ = new BehaviorSubject<boolean>(false);
    timeProgress$ = new BehaviorSubject<number>(0);
    wordValid$ = new Subject<boolean>()
    gameOverConditionInSeconds = GameService.GAME_END_CONDITION_IN_SECONDS;
    wordLengthLimit = GameService.GAME_WORD_LENGTH_LIMIT;
    private timerInterval!: any
    private applyChangesTimeout!: any;

    constructor(public gameService: GameService,
                private modalService: BsModalService,
                private backendService: BackendService,
                private cdr: ChangeDetectorRef,
                private router: Router) {
    }

    ngOnInit() {
        if (this.gameService.gameData?.timerProgress) {
            this.timeProgress$.next(this.gameService.gameData.timerProgress);
            this.resumeTimer();
        } else {
            this.createTimer();
        }

        // function to subscribe to inProgress BehaviorSubject
        this.inProgress$.subscribe(value => {
            if (value) {
                clearTimeout(this.applyChangesTimeout);
                this.pauseTimer();
            } else {
                this.resumeTimer();
            }
        })
    }

    actionExitGame() {
        this.router.navigate([''], {skipLocationChange: true})
    }

    ngOnDestroy(): void {
        clearInterval(this.timerInterval);
    }

    handleWordSubmittedEvent(selectedLetterIndexes: number[]) {
        this.inProgress$.next(true);
        this.pauseTimer();
        this.cdr.detectChanges();

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
                    this.router.navigate(['game-over'], {skipLocationChange: true})
                }
            });
    }

    private wordIncorrect() {
        this.cdr.detectChanges();
        this.gameService.missedWords?.push(this.gameService.currentWord)
        this.wordValid$.next(false);
        this.inProgress$.next(false);
    }

    private createTimer() {
        this.gameService.gameData!.timerProgress = 0;
        this.resumeTimer();
    }

    private pauseTimer() {
        clearInterval(this.timerInterval);
    }

    private resumeTimer() {
        if (this.timerInterval) {
            this.pauseTimer()
        }

        this.timerInterval = setInterval(() => {
            this.gameService.gameData!.timerProgress += 1;
            this.gameService.persistGameData();
            if (this.gameService.gameData!.timerProgress >= this.gameOverConditionInSeconds) {
                this.handleGameOverCondition();
            } else {
                this.timeProgress$.next(this.gameService.gameData!.timerProgress);
            }

        }, GameService.GAME_TIME_OUT_MILIS)
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
                this.gameService.persistGameData()
                this.router.navigate(['game-over'], {skipLocationChange: true})
            })
    }

    private wordCorrect(check: CheckWordResult) {
        this.gameService.gameData!.timerProgress = Math.max(this.gameService.gameData!.timerProgress - this.gameService.timeBonusByWord(), 0);
        this.timeProgress$.next(this.gameService.gameData!.timerProgress);
        this.gameService.guessedWords?.push(this.gameService.currentWord)
        this.wordValid$.next(true);
        this.cdr.detectChanges();

        this.applyChangesTimeout = setTimeout(() => {
            // wait for animation to apply changes
            this.gameService.applyBackendGame(check.game);
            this.inProgress$.next(false);
            this.cdr.detectChanges();
        }, 700);
    }

}
