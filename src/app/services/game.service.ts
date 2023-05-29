import {Injectable} from '@angular/core';
import {Subject} from "rxjs";
import {BackendService, Game} from "./backend.service";

export interface BoggleLetter {
    value: string
    selected: boolean
    selectedIndex: number
    boardIndex: number
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

    public static GAME_TIME_OUT_MILIS = 1000;
    public static BOARD_SIZE = 16;
    public static LOCAL_STORAGE_GAME_DATA = 'gameDataV2';
    public static LOCAL_STORAGE_GAME_SETTINGS = 'gameSettings';

    letterValues: { [key: string]: number } = {
        'a': 1,
        'b': 3,
        'c': 3,
        'č': 4,
        'd': 2,
        'e': 1,
        'f': 7,
        'g': 4,
        'h': 5,
        'i': 1,
        'j': 4,
        'k': 2,
        'l': 1,
        'm': 2,
        'n': 2,
        'o': 1,
        'p': 3,
        'r': 1,
        's': 2,
        'š': 4,
        't': 2,
        'u': 4,
        'v': 4,
        'z': 2,
        'ž': 10,
    };
    gameSettings: GameSettings = {} as GameSettings
    gameDataSubject$ = new Subject<any>();
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

    get guessedWords() {
        return this.gameData?.guessedWords;
    }

    get missedWords() {
        return this.gameData?.missedWords;
    }

    get currentWord(): string {
        const boggleLettersBySelectedIndex = this.selectedByLastIndex;
        let currentWordInReverse = '';
        boggleLettersBySelectedIndex.forEach(letter => {
            if (letter.selectedIndex > 0) {
                currentWordInReverse += letter.value;
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
        const bonus = Math.pow(2, this.currentWord.length - 1);
        return Math.min(bonus, 100);
    }

    public sortBySelectedIndex(arr: any[]) {
        return arr.sort((a, b) => b.selectedIndex - a.selectedIndex);
    }

    stateChanged(wordGuess?: boolean) {
        this.gameDataSubject$.next(wordGuess);
        this.persistGameData();
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
                value: letter.char,
                selected: false,
                selectedIndex: 0,
                boardIndex: index
            } as BoggleLetter
        });

        this.gameData!.game = game;
        this.gameData!.lettersBag = this.convertToMultiDimensionalBoardBag(playerLettersBag);
    }

    public persistGameData() {
        localStorage.setItem(GameService.LOCAL_STORAGE_GAME_DATA, JSON.stringify(this.gameData));
    }
}
