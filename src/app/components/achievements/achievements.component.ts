import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AchievementsComponent {
  constructor(public gameService: GameService) {
  }

    protected readonly GameService = GameService;
}
