import { Component, Input } from '@angular/core';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-level-ribbon',
  templateUrl: './level-ribbon.component.html',
  styleUrls: ['./level-ribbon.component.scss']
})
export class LevelRibbonComponent {

  @Input()
  level = 0;
  constructor(public gameService: GameService) {
    if(!this.level) {
      this.level = this.gameService.gameData?.game?.level || 1;
    }
  }
}
