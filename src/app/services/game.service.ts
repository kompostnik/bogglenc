import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { BackendService, Game, Letter } from './backend.service';

export interface BoggleLetter extends Letter {
    selected: boolean
    selectedIndex: number
    boardIndex: number
    inWarning: boolean
}

export interface GameSettings {
    lumMode?: string
}

export interface GameData {
    timerProgress: number;
    guessedWords: string[];
    missedWords: string[];
    lettersBag: BoggleLetter[][];
    game: Game;
}


@Injectable({
    providedIn: 'root'
})
export class GameService {

    public static GAME_TIME_OUT_MILIS = 100;
    public static GAME_WORDS_LIMIT = 100;
    public static GAME_END_CONDITION_IN_SECONDS = 100;
    public static GAME_WORD_LENGTH_LIMIT = 3;
    public static BOARD_SIZE = 16;
    public static LOCAL_STORAGE_GAME_DATA = 'gameDataV2';
    public static LOCAL_STORAGE_GAME_SETTINGS = 'gameSettings';

    letterValues: { [key: string]: number } = {
        'a': 0,
        'b': 0,
        'c': 0,
        'č': 0,
        'd': 0,
        'e': 0,
        'f': 0,
        'g': 0,
        'h': 0,
        'i': 0,
        'j': 0,
        'k': 0,
        'l': 0,
        'm': 0,
        'n': 0,
        'o': 0,
        'p': 0,
        'r': 0,
        's': 0,
        'š': 0,
        't': 0,
        'u': 0,
        'v': 0,
        'z': 0,
        'ž': 0,
    };
    gameSettings: GameSettings = {} as GameSettings
    leaderBoardFormSubject$ = new Subject<any>();
    beforeInstallPrompt: any;

    constructor(private backendService: BackendService) {
    }

    private _gameData!: GameData | undefined;

    get gameData(): GameData | undefined {
        if (this._gameData) {
            return this._gameData;
        } else {
            const localStoredGaeData = localStorage.getItem(GameService.LOCAL_STORAGE_GAME_DATA);
            if (localStoredGaeData) {
                return this._gameData = JSON.parse(localStoredGaeData);
            } else {
                return undefined;
            }
        }
    }

    set gameData(value: GameData | undefined) {
        this._gameData = value;
    }

    get score() {
        return this.gameData?.game.score;
    }

    get guessedWords(): string[] | undefined {
        return this.gameData?.guessedWords;
    }

    get missedWords() {
        return this.gameData?.missedWords;
    }

    get currentWord(): string {
        const boggleLettersBySelectedIndex = this.selectedByLastIndex;
        let currentWordInReverse = '';
        boggleLettersBySelectedIndex.forEach((letter: BoggleLetter) => {
            if (letter.selectedIndex > 0) {
                currentWordInReverse += letter.char;
            }
        })
        return currentWordInReverse.split("").reverse().join("");
    }

    get selectedByLastIndex() {
        return this.sortBySelectedIndex(this.selectedLetters);
    }

    get boardBag(): BoggleLetter[] {
        return this.gameData!.lettersBag
            .flat();
    }

    get selectedLetters() {
        return this.gameData!.lettersBag.flat().filter(letter => letter.selected);
    }

    timeBonusByWord(): number{
        const bonus = Math.pow(2, this.currentWord.length - 1) ;
        return Math.min(bonus, 100);
    }

    public sortBySelectedIndex(arr: any[]) {
        return arr.sort((a, b) => b.selectedIndex - a.selectedIndex);
    }

    public convertToMultiDimensionalBoardBag(arr: BoggleLetter[]): BoggleLetter[][] {

        const multidimensional: any[] = [];

        arr.forEach((value, index) => {
            const rowIndex = Math.floor(index / 4);

            if (!multidimensional[rowIndex]) {
                multidimensional[rowIndex] = [];
            }
            multidimensional[rowIndex].push(value);
        })

        return multidimensional;
    }

    public toggleLightDarkMode() {
        const token = 'dark';
        if (document.body.classList.contains(token)) {
            document.body.classList.remove(token)
            this.setLumMode('');
        } else {
            this.setLumMode(token);
        }
    }

    public setLumMode(token: string) {
        if (token) {
            document.body.classList.add(token)
        }
        this.gameSettings.lumMode = token;
        localStorage.setItem(GameService.LOCAL_STORAGE_GAME_SETTINGS, JSON.stringify(this.gameSettings));
    }

    public applyBackendGame(game: Game) {
        const playerLettersBag = game.board.map((letter, index) => {

            return {
                ...letter,
                ...{
                    selected: false,
                    selectedIndex: 0,
                    boardIndex: index,
                    inWarning: false
                }}
        });

        this.gameData!.game = game;
        this.gameData!.lettersBag = this.convertToMultiDimensionalBoardBag(playerLettersBag);
    }

    public persistGameData() {
        localStorage.setItem(GameService.LOCAL_STORAGE_GAME_DATA, JSON.stringify(this.gameData));
    }
}
