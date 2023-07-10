import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
    selector: 'app-timer',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimerComponent implements OnInit {

    @Input()
    timeProgress$!: BehaviorSubject<number>;
    @Input()
    gameOverCondition!: number;

    time = 0;

    constructor(private cdr: ChangeDetectorRef) {

    }

    ngOnInit(): void {
        this.timeProgress$.subscribe(value => {
            this.time = value;
            this.cdr.markForCheck();
        });
    }

    get width() {
        return this.time / this.gameOverCondition * 100;
    }

    get lastSeconds():boolean {
        // is 10 seconds or less left
        return this.gameOverCondition - this.time <= 10;
    }
}
