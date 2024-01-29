import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { GameService } from '../../services/game.service';
import { LeaderBoardModalComponent } from '../leader-board-modal/leader-board-modal.component';
import { Router } from '@angular/router';

export enum LumMode {
    LIGHT, DARK
}

@Component({
    selector: 'app-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuComponent {

    mode = LumMode.LIGHT;
    protected readonly GameService = GameService;

    constructor(public modalRef: BsModalRef,
                public gameService: GameService,
                private cdr: ChangeDetectorRef,
                private modalService: BsModalService,
                private router: Router) {
        if (document.body.classList.contains('dark')) {
            this.mode = LumMode.DARK;
        }
    }

    toggleLightDarkMode() {

        if (this.mode === LumMode.LIGHT) {
            this.mode = LumMode.DARK;
        } else {
            this.mode = LumMode.LIGHT;
        }

        this.gameService.toggleLightDarkMode()
    }

    actionOpenLeaderBoard() {
        this.modalRef.hide();
        setTimeout(() => this.modalService.show(LeaderBoardModalComponent), 150)
    }

    actionExitGame() {
        this.router.navigate([''], {skipLocationChange: true})
        this.modalRef.hide();
    }
}
