import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { GameService } from '../../services/game.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { LeaderBoardFormComponent } from '../../components/leader-board-form/leader-board-form.component';
import { Router } from '@angular/router';
import { AchievementsComponent } from '../../components/achievements/achievements.component';
import { AuthService } from '../../services/auth.service';
import { BehaviorSubject, catchError, throwError } from 'rxjs';
import { BackendService } from '../../services/backend.service';

@Component({
    selector: 'app-game-over',
    templateUrl: './game-over.component.html',
    styleUrls: ['./game-over.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameOverComponent implements OnInit {
    protected readonly GameService = GameService;
    inProgress$ = new BehaviorSubject<boolean>(false);

    constructor(public gameService: GameService,
                private modalService: BsModalService,
                private router: Router,
                public authService: AuthService,
                private backendService:BackendService) {

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

    actionOpenLeaderBoardForm() {
        this.modalService.show(LeaderBoardFormComponent)
    }

    actionBackToMainMenu() {
        this.router.navigate([''], {skipLocationChange: true})
    }

    actionOpenAchievementsModal() {
        this.modalService.show(AchievementsComponent, {class: 'modal-lg'})
    }

    submitScoreToLeaderboard(){
        if(!this.gameService.gameData!.game.name && this.authService.isAuthenticated && this.authService.user!.name){
            this.inProgress$.next(true);
            this.backendService.submitName(this.gameService.gameData!.game.id, this.authService.user!.name)
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
                    this.gameService.persistGameData()
                })
        }

    }

    ngOnInit(): void {

        this.submitScoreToLeaderboard();
    }
}
