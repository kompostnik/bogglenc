import { Component } from '@angular/core';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-level-ribbon',
  templateUrl: './level-ribbon.component.html',
  styleUrls: ['./level-ribbon.component.scss']
})
export class LevelRibbonComponent {

  level= 0;
  constructor(public gameService: GameService) {
    this.level = this.gameService.gameData?.game?.level || 1;
  }
}
