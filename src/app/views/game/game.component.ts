import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { GameService } from '../../services/game.service';
import { MenuComponent } from '../../components/menu/menu.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject, catchError, Subject, throwError } from 'rxjs';
import { BackendService, CheckWordResult, Game } from '../../services/backend.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-game',
    templateUrl: './game.component.html',
    styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, OnDestroy {

    inProgress$ = new BehaviorSubject<boolean>(false);
    timeProgress$ = new BehaviorSubject<number>(0);
    wordValid$ = new Subject<boolean>()
    gameOverConditionInSeconds = GameService.GAME_END_CONDITION_IN_SECONDS;
    wordLengthLimit = GameService.GAME_WORD_LENGTH_LIMIT;
    private timerInterval!: any
    private applyChangesTimeout!: number;

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
        
        this.processLevelUps(this.gameService.gameData?.game!)
        
        // function to subscribe to inProgress BehaviorSubject
        this.inProgress$.subscribe(value => {
            if (value) {
                this.pauseTimer();
            } else {
                this.resumeTimer();
            }
        })
    }

    actionOpenMenu() {
        return this.modalService.show(MenuComponent);
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

        // this.timerInterval = setInterval(() => {
        //     this.gameService.gameData!.timerProgress += 1;
        //     this.gameService.persistGameData();
        //     if (this.gameService.gameData!.timerProgress >= this.gameOverConditionInSeconds) {
        //         this.handleGameOverCondition();
        //     } else {
        //         this.timeProgress$.next(this.gameService.gameData!.timerProgress);
        //     }
        //
        // }, GameService.GAME_TIME_OUT_MILIS)
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
        this.applyChangesTimeout = setTimeout(() => {
            // wait for animation to apply changes
            this.gameService.applyBackendGame(check.game);
            this.inProgress$.next(false);
            this.cdr.detectChanges();
        }, 700);
        this.gameService.guessedWords?.push(this.gameService.currentWord)
        this.wordValid$.next(true);
        this.gameService.gameData!.timerProgress = Math.max(this.gameService.gameData!.timerProgress - this.gameService.timeBonusByWord(), 0);;
        this.timeProgress$.next(this.gameService.gameData!.timerProgress);
        this.processLevelUps(check.game);
        this.cdr.detectChanges();
    }

    private processLevelUps(game: Game) {
        // reduce game over condition by level for 20%
        if (game.level === 1) {
            this.gameOverConditionInSeconds = GameService.GAME_END_CONDITION_IN_SECONDS;
        }
        if (game.level === 2) {
            this.gameOverConditionInSeconds = 80;
        }
        if (game.level === 3) {
            this.gameOverConditionInSeconds = 64;
        }
        if (game.level === 4) {
            this.gameOverConditionInSeconds = 51;
        }
        if (game.level === 5) {
            this.gameOverConditionInSeconds = 40;
        }
        if (game.level === 6) {
            this.gameOverConditionInSeconds = 32;
        }
        if (game.level === 7) {
            this.gameOverConditionInSeconds = 26;
            this.wordLengthLimit = 4
        }
        if (game.level === 8) {
            this.gameOverConditionInSeconds = 20;
            this.wordLengthLimit = 5
        }
    }
}
