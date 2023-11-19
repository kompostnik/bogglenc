import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BoggleLetter, GameService } from '../../services/game.service';
import { BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { BackendService } from '../../services/backend.service';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { GameState } from '../../views/game/game.component';
import { LeaderBoardModalComponent } from '../leader-board-modal/leader-board-modal.component';
import { AuthService } from '../../services/auth.service';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';

@Component({
    selector: 'app-board',
    templateUrl: './board.component.html',
    styleUrls: ['./board.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardComponent implements OnInit, OnDestroy {

    wordInvalid = false;
    flipCards: number[] = [];

    @Input()
    wordValid$!: Subject<boolean>;

    @Input()
    inProgress$!: BehaviorSubject<boolean>;

    @Input()
    gameState$!: BehaviorSubject<GameState | undefined>;

    @Input()
    lettersBag!: BoggleLetter[][];

    @Input()
    gameOverCondition!: number;

    @Input()
    timeProgress!: number;

    @Input()
    wordLengthLimit !: number;

    @Output()
    wordSubmitEvent = new EventEmitter<number[]>();
    protected readonly GameService = GameService;
    protected readonly GameState = GameState;
    private flipTimeout!: any;
    private wordValidSubscription!: Subscription;
    private gameStateSubscription!: Subscription;

    constructor(private httpClient: HttpClient,
                public gameService: GameService,
                private modalService: BsModalService,
                private backendService: BackendService,
                private cdr: ChangeDetectorRef,
                public authService: AuthService) {

    }

    get selectedLettersAsWord() {
        const selectedLetters = this.gameService.boardBag
            .filter(letter => {
                return letter.selected;
            });
        selectedLetters.sort((a, b) => a.selectedIndex - b.selectedIndex);
        const selectedLetterChars = selectedLetters.map(letter => {
            return letter.char;
        });

        return selectedLetterChars.join('');
    }

    get besedWord(): string {
        const leftWordsToGuess = GameService.GAME_WORDS_LIMIT - (this.gameService.guessedWords?.length ?? 0);
        if (leftWordsToGuess === 4 || leftWordsToGuess === 3) {
            return `${leftWordsToGuess} gesla`;
        } else if (leftWordsToGuess === 2) {
            return `${leftWordsToGuess} gesli`;
        } else if (leftWordsToGuess === 1) {
            return `${leftWordsToGuess} geslo`;
        } else {
            return `${leftWordsToGuess} gesel`;
        }
    }

    get gameOver() {
        return this.gameState$.value === GameState.GAME_FINISHED;
    }

    selectCell(row: number, index: number) {
        this.wordInvalid = false;

        let cell = this.lettersBag[row][index];

        const selectedByLastIndex = this.gameService.selectedByLastIndex[0];
        if (cell.selected && cell.selectedIndex === selectedByLastIndex.selectedIndex) {
            // unselect
            cell.selected = false;
            cell.selectedIndex = 0;
            // this.checkForAlreadyGuessedWord();
            return;
        }

        if (cell.selected) {
            return;
        }

        if (selectedByLastIndex) {
            cell.selectedIndex = selectedByLastIndex.selectedIndex + 1;
        } else {
            cell.selectedIndex = 1;
        }

        // Select the new cell and update the selected row and col
        cell.selected = true;

        this.gameService.persistGameData();

        // this.checkForAlreadyGuessedWord();
    }

    calculateLettersValue(word: string): number {

        let score = 0;

        this.gameService.selectedLetters.forEach((letter: BoggleLetter) => {
            score += letter.score;
        });

        return score;
    }

    calculateWordLengthValue(word: string) {
        let score = 0;
        if (word.length >= 4) {
            score += Math.pow(2, word.length - 4);
        }
        return score;
    }

    submit() {

        const selectedLetters = this.gameService.boardBag
            .filter(letter => {
                return letter.selected;
            });
        selectedLetters.sort((a, b) => a.selectedIndex - b.selectedIndex);
        const selectedLetterIndexes = selectedLetters.map(letter => {
            return letter.boardIndex;
        });
        this.wordSubmitEvent.emit(selectedLetterIndexes);
    }

    restCurrentWord() {
        this.wordInvalid = false;
        this.gameService.boardBag.forEach(value => {
            value.selected = false;
            value.selectedIndex = 0;
        });
        this.gameService.persistGameData();
    }

    ngOnInit(): void {
        this.wordValidSubscription = this.wordValid$.subscribe(value => {
            if (value) {
                this.wordCorrect();
            } else {
                this.wordIncorrect();
            }
        });
        this.gameStateSubscription = this.gameState$.subscribe(value => {
            this.cdr.detectChanges();
        });
    }

    ngOnDestroy(): void {
        clearTimeout(this.flipTimeout);
        if (this.wordValidSubscription) {
            this.wordValidSubscription.unsubscribe();
        }
        if (this.gameStateSubscription) {
            this.gameStateSubscription.unsubscribe();
        }
    }

    private wordIncorrect() {
        this.wordInvalid = true;
        this.cdr.markForCheck();
    }

    private wordCorrect() {
        this.flipCards = this.gameService.boardBag
            .filter(letter => letter.selectedIndex > 0)
            .map(letter => letter.boardIndex);

        this.flipTimeout = setTimeout(() => {
            this.flipCards = [];
        }, 1000);

        this.wordInvalid = false;
        this.cdr.markForCheck();
    }

    actionLeaderBoard() {
        return this.modalService.show(LeaderBoardModalComponent);
    }

    actionAuthenticate() {
        const bsModalRef = this.modalService.show(AuthModalComponent, {
            initialState: {
                infoText: 'Za beleženje dokončanih iger se moraš prijavit. Izberi sredstvo za prijavo.',
                redirect: undefined
            }
        } as ModalOptions);

        bsModalRef.onHide!.subscribe(value => {
            this.cdr.detectChanges();
        });
    }
}