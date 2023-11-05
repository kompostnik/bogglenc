import { APP_INITIALIZER, isDevMode, NgModule } from '@angular/core';
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
import { FormsModule } from '@angular/forms';
import { ExtendedFirebaseUIAuthConfig, firebase, firebaseui, FirebaseUIModule } from 'firebaseui-angular-i18n';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFireModule } from '@angular/fire/compat';
import { AuthService } from './services/auth.service';
import { AuthModalComponent } from './components/auth-modal/auth-modal.component';
import { BackendService } from './services/backend.service';
import { PlayerAvatarComponent } from './components/player-avatar/player-avatar.component';
import { catchError, throwError } from 'rxjs';

const firebaseUiAuthConfig: ExtendedFirebaseUIAuthConfig = {
    signInFlow: 'popup',
    signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        {
            scopes: [
                'public_profile',
                'email'
            ],
            customParameters: {
                'auth_type': 'reauthenticate'
            },
            provider: firebase.auth.FacebookAuthProvider.PROVIDER_ID
        },
        firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        firebase.auth.GithubAuthProvider.PROVIDER_ID,
        {
            requireDisplayName: false,
            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID
        }
    ],
    credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO,

    // Optional. Set it to override the default language (English)
    language: 'sl'
};

export function authInitializer(authService: AuthService, backendService: BackendService) {
    return (): Promise<any> => {
        return new Promise(resolve => {
            authService.user$.subscribe(user => {
                if (user) {
                    backendService.readPlayerProfile(user.uid, undefined)
                        .pipe(catchError((err, caught) => {
                            resolve(true);
                            return throwError(err);
                        }))
                        .subscribe(value => {
                            authService.user!.name = value.nickname;
                            resolve(true);
                        });
                } else {
                    resolve(true);
                }
            });
        });
    };
}

@NgModule({
    declarations: [
        AppComponent,
        BoardComponent,
        ScoreComponent,
        InventoryComponent,
        MenuComponent,
        LeaderBoardComponent,
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
        AuthModalComponent,
        PlayerAvatarComponent
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
        FormsModule,
        AppRoutingModule,
        AngularFireModule.initializeApp(environment.firebase),
        AngularFireAuthModule,
        FirebaseUIModule.forRoot(firebaseUiAuthConfig),
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
    providers: [
        {
            provide: APP_INITIALIZER,
            useFactory: authInitializer,
            deps: [AuthService, BackendService],
            multi: true
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
