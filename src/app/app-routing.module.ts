import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainMenuComponent } from './views/main-menu/main-menu.component';
import { GameComponent } from './views/game/game.component';
import { GameOverComponent } from './views/game-over/game-over.component';
import { ProfileComponent } from './views/profile/profile.component';

const routes: Routes = [
    {
        path: '',
        component: MainMenuComponent
    },
    {
        path: 'game',
        component: GameComponent
    },
    {
        path: 'game-over',
        component: GameOverComponent
    },
    {
        path: 'profile',
        component: ProfileComponent
    },
    {
        path: 'profile/:id',
        component: ProfileComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {

}
