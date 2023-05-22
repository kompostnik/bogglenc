import {Component, OnDestroy, OnInit} from '@angular/core';
import {BsModalService} from "ngx-bootstrap/modal";
import {GameService} from "../game.service";
import {catchError, Subscription, throwError} from "rxjs";
import {BackendService, Game} from "../backend.service";

@Component({
    selector: 'app-leader-board',
    templateUrl: './leader-board.component.html',
    styleUrls: ['./leader-board.component.scss']
})
export class LeaderBoardComponent implements OnInit, OnDestroy {
    numbers = Array(50).fill(0).map((x, i) => i);
    games: Game[] = [];
    inProgress = false;
    private leaderBoardFormSubscription!: Subscription;

    constructor(private modalService: BsModalService,
                public gameService: GameService,
                public backendService: BackendService) {
    }

    ngOnInit() {
        this.fetchLeaderBoard();

        this.leaderBoardFormSubscription = this.gameService.leaderBoardFormSubject$.subscribe(value => {
            this.fetchLeaderBoard();
            this.scrollToRank();
        });
    }

    ngOnDestroy(): void {
        this.leaderBoardFormSubscription.unsubscribe();
    }

    private fetchLeaderBoard() {
        this.inProgress = true;
        this.backendService.getLeaderBoard()
            .pipe(
                catchError(err => {
                    this.inProgress = false;
                    console.log('Handling error locally and rethrowing it...', err);
                    return throwError(err);
                })
            )
            .subscribe(data => {
                this.games = data as any[];
                this.inProgress = false;
            })
    }

    private scrollToRank() {
        const element = document.getElementById(`${this.gameService.gameData.game.leaderboardRank}`)
        if (element) {
            setTimeout(() => element.scrollIntoView({block: "start", behavior: "auto"}), 700);
        }
    }

    isCurrentGame(game: Game): boolean {
        if (this.gameService.gameData && this.gameService.gameData.game) {
            return game.id === this.gameService.gameData.game.id
        }
        return false;
    }
}
