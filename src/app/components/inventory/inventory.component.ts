import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { GameService } from '../../services/game.service';
import { AchievementsComponent } from '../achievements/achievements.component';

@Component({
    selector: 'app-inventory',
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryComponent {

    @Input()
    gameOverCondition!: number;

    modalRef?: BsModalRef;

    protected readonly GameService = GameService;

    constructor(private modalService: BsModalService, public gameService: GameService) {
    }

    actionOpenAchievementsModal() {
        this.modalRef = this.modalService.show(AchievementsComponent, {class: 'modal-lg'})
    }
}
