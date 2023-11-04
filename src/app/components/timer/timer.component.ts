import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
    selector: 'app-timer',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimerComponent {

    @Input()
    timeProgress = 0;
    @Input()
    gameOverCondition!: number;

    get width() {
        return this.timeProgress / this.gameOverCondition * 100;
    }

    get lastSeconds():boolean {
        // is 10 seconds or less left
        return this.gameOverCondition - this.timeProgress <= 10;
    }
}
