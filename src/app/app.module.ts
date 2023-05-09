import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BoardComponent} from './board/board.component';
import {HttpClientModule} from "@angular/common/http";
import {GoalsComponent} from './goals/goals.component';
import {ScoreComponent} from './score/score.component';
import {InventoryComponent} from './inventory/inventory.component';
import {ModalModule} from "ngx-bootstrap/modal";
import {NgCircleProgressModule} from "ng-circle-progress";
import {MenuComponent} from './menu/menu.component';

@NgModule({
  declarations: [
    AppComponent,
    BoardComponent,
    GoalsComponent,
    ScoreComponent,
    InventoryComponent,
    MenuComponent
  ],
  imports: [
    ModalModule.forRoot(),
    NgCircleProgressModule.forRoot(),
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
