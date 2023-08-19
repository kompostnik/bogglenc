import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BoggleLetter, GameService } from '../../services/game.service';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BackendService } from '../../services/backend.service';
import { catchError, throwError } from 'rxjs';

@Component({
    selector: 'app-leader-board-form',
    templateUrl: './leader-board-form.component.html',
    styleUrls: ['./leader-board-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeaderBoardFormComponent {
    public static VICTORY_ENTRY_MAX_LEN = 16;
    boardBag!: BoggleLetter[][];
    inProgress!: boolean;
    charArr!: string[]
    maxLength = false;
    bagIndex = 0;

    constructor(public gameService: GameService, public modalRef: BsModalRef, private backendService: BackendService) {

        let s = '';
        for (var i = 40; i <= 64; i++) {
            s += String.fromCharCode(i);
        }

        this.charArr = Object.keys(this.gameService.letterValues);
        this.charArr.push(...s.split(''))
        this.generateBoardBag();
    }

    _currentWord = ''

    get currentWord() {
        return this._currentWord;
    }

    set currentWord(value: string) {
        this._currentWord = value
        this.maxLength = this._currentWord.length >= LeaderBoardFormComponent.VICTORY_ENTRY_MAX_LEN;
    }

    get sortBySelectedIndex() {
        return this.gameService.sortBySelectedIndex(this.boardBag.flat())
    }

    selectCell(row: number, index: number) {

        let cell = this.boardBag[row][index];

        if(cell && cell.char) {
            const selectedByLastIndex = this.sortBySelectedIndex[0];
            if (cell.selected && cell.selectedIndex === selectedByLastIndex.selectedIndex) {
                // unselect
                cell.selected = false;
                cell.selectedIndex = 0;
                this.currentWord = this.currentWord.substring(0, this.currentWord.length - 1);
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

            this.currentWord += cell.char
        }
    }

    submit() {

        this.inProgress = true;
        this.backendService.submitName(this.gameService.gameData!.game.id, this.currentWord)
            .pipe(
                catchError(err => {
                    this.inProgress = false;
                    console.log('Handling error locally and rethrowing it...', err);
                    return throwError(err);
                })
            )
            .subscribe(value => {
                this.inProgress = false;
                this.gameService.leaderBoardFormSubject$.next(true);
                this.gameService.gameData!.game.name = this.currentWord;
                this.gameService.persistGameData()
                this.modalRef.hide();
            })
    }

    restCurrentWord() {
        this.currentWord = '';
        this.boardBag.flat().forEach(value => {
            value.selected = false;
            value.selectedIndex = 0;
        })
    }

    reRoll() {
        this.bagIndex += GameService.BOARD_SIZE;
        if(this.bagIndex > 48){
            this.bagIndex = 0;
        }
        this.generateBoardBag();
    }

    private generateBoardBag() {
        const arr = [];

        for (let i = 0; i < GameService.BOARD_SIZE; i++) {

            arr.push({
                char: this.charArr[i + this.bagIndex],
                selectedIndex: 0,
                boardIndex: i,
                selected: false,
                score: 0
            })
        }

        this.boardBag = this.gameService.convertToMultiDimensionalBoardBag(arr)
    }
}
