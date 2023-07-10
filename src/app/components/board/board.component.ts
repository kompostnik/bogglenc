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
import { BsModalService } from 'ngx-bootstrap/modal';
import { BackendService } from '../../services/backend.service';
import { BehaviorSubject, Subject } from 'rxjs';

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
    lettersBag!: BoggleLetter[][];

    @Input()
    gameOverCondition!: number;

    @Input()
    timeProgress$!: BehaviorSubject<number>;

    @Input()
    wordLengthLimit !: number;

    @Output()
    wordSubmitEvent = new EventEmitter<number[]>();

    private flipTimeout!: number;

    constructor(private httpClient: HttpClient,
                public gameService: GameService,
                private modalService: BsModalService,
                private backendService: BackendService,
                private cdr: ChangeDetectorRef) {

    }

    selectCell(row: number, index: number) {
        this.wordInvalid = false;

        let cell = this.lettersBag[row][index];

        const selectedByLastIndex = this.gameService.selectedByLastIndex[0];
        if (cell.selected && cell.selectedIndex === selectedByLastIndex.selectedIndex) {
            // unselect
            cell.selected = false;
            cell.selectedIndex = 0;
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
        this.wordValid$.subscribe(value => {
            if (value) {
                this.wordCorrect();
            } else {
                this.wordIncorrect();
            }
        });

        this.setupWordLengthLimit();
    }

    ngOnDestroy(): void {
        clearTimeout(this.flipTimeout);
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

        this.setupWordLengthLimit();
        this.wordInvalid = false;
        this.cdr.markForCheck();
    }

    private setupWordLengthLimit() {
        if (this.gameService.gameData?.game.level! === 7) {
            this.wordLengthLimit = 4;
        } else if (this.gameService.gameData?.game.level! >= 8) {
            this.wordLengthLimit = 5;
        }
    }
}
