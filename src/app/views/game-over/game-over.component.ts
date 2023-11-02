import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GameService } from '../../services/game.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { LeaderBoardFormComponent } from '../../components/leader-board-form/leader-board-form.component';
import { Router } from '@angular/router';
import { AchievementsComponent } from '../../components/achievements/achievements.component';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-game-over',
    templateUrl: './game-over.component.html',
    styleUrls: ['./game-over.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameOverComponent {
    protected readonly GameService = GameService;

    constructor(public gameService: GameService,
                private modalService: BsModalService,
                private router: Router,
                public authService: AuthService) {

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
}
