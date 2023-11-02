import { isDevMode, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import { AppComponent } from './app.component';
import { BoardComponent } from './components/board/board.component';
import { environment } from '../environments/environment';
import { HttpClientModule } from '@angular/common/http';
import { ScoreComponent } from './components/score/score.component';
import { InventoryComponent } from './components/inventory/inventory.component';
import { ModalModule } from 'ngx-bootstrap/modal';
import { MenuComponent } from './components/menu/menu.component';
import { LeaderBoardComponent } from './components/leader-board/leader-board.component';
import { LeaderBoardFormComponent } from './components/leader-board-form/leader-board-form.component';
import { LeaderBoardModalComponent } from './components/leader-board-modal/leader-board-modal.component';
import { MainMenuComponent } from './views/main-menu/main-menu.component';
import { VictoryConfettiComponent } from './components/victory-confetti/victory-confetti.component';
import { ModalComponent } from './components/modal/modal.component';
import { AchievementsComponent } from './components/achievements/achievements.component';
import { GameComponent } from './views/game/game.component';
import { GameOverComponent } from './views/game-over/game-over.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { TimerComponent } from './components/timer/timer.component';
import { BoardKeyComponent } from './components/board-key/board-key.component';
import { ProfileComponent } from './views/profile/profile.component';
import { AuthComponent } from './views/auth/auth.component';
import { FormsModule } from '@angular/forms';

@NgModule({
    declarations: [
        AppComponent,
        BoardComponent,
        ScoreComponent,
        InventoryComponent,
        MenuComponent,
        LeaderBoardComponent,
        LeaderBoardFormComponent,
        LeaderBoardModalComponent,
        MainMenuComponent,
        VictoryConfettiComponent,
        ModalComponent,
        AchievementsComponent,
        GameComponent,
        GameOverComponent,
        TimerComponent,
        BoardKeyComponent,
        ProfileComponent,
        AuthComponent
    ],
    imports: [
        provideFirebaseApp(() => initializeApp(environment.firebase)),
        provideAuth(() => {
            const auth = getAuth();
            if (isDevMode()) {
                connectAuthEmulator(auth, 'http://localhost:9099', {
                    disableWarnings: true
                });
            }
            return auth;
        }),
        ModalModule.forRoot(),
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        ServiceWorkerModule.register('ngsw-worker.js', {
            enabled: !isDevMode(),
            // Register the ServiceWorker as soon as the application is stable
            // or after 30 seconds (whichever comes first).
            registrationStrategy: 'registerWhenStable:30000'
        }),
        FormsModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
