import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Letter {
    char: string;
    score: number;
}

export interface Game {
    id: string;
    board: Letter[];
    score: number;
    wordCount: number;
    leaderboardRank: number | null;
    name: string | null;
    startedAt: number;
    endedAt: number | null;
    level: number;
}

export interface CheckWordResult {
    word: string;
    correct: boolean;
    scoreForWord: number;
    game: Game;
}

@Injectable({
    providedIn: 'root'
})
export class BackendService {

    constructor(private httpClient: HttpClient) {
    }

    getLeaderBoard(): Observable<Game[]> {
        return this.httpClient.get(`${environment.backendPath}/getLeaderboard`, {responseType: "json"}) as Observable<Game[]>
    }

    startGame(): Observable<Game> {
        return this.httpClient.get(`${environment.backendPath}/startGame`, {responseType: "json"}) as Observable<Game>
    }

    guessTheWord(gameId: string, selectedCharacters: number[]): Observable<CheckWordResult> {
        const payload = {gameId: gameId, letterIndexes: selectedCharacters}
        return this.httpClient.post(`${environment.backendPath}/guessTheWord`, payload, {responseType: "json"}) as Observable<CheckWordResult>
    }

    submitName(gameId: string, name: string): Observable<CheckWordResult> {
        const payload = { gameId: gameId, name: name }
        return this.httpClient.post(`${environment.backendPath}/submitName`, payload, {responseType: "json"}) as Observable<CheckWordResult>
    }

    gameOver(gameId: string): Observable<Game> {
        const payload = { gameId: gameId }
        return this.httpClient.post(`${environment.backendPath}/gameOver`, payload, {responseType: "json"}) as Observable<Game>
    }
}