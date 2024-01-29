import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';

@Component({
    selector: 'app-victory-confetti',
    templateUrl: './victory-confetti.component.html',
    styleUrls: ['./victory-confetti.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VictoryConfettiComponent implements OnDestroy, OnInit {
    private timeout: any;

    ngOnDestroy() {
        clearTimeout(this.timeout);
    }

    ngOnInit(): void {
        this.victoryConfetti();
    }

    private confetti(args: any) {
        return (window as any)['confetti'].apply(this, arguments);
    }

    private shoot() {
        try {
            this.confetti({
                angle: this.random(60, 120),
                spread: this.random(10, 50),
                particleCount: this.random(40, 50),
                origin: {
                    y: 0.5
                }
            });
        } catch (e) {
            // noop, confettijs may not be loaded yet
        }
    }

    private random(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    private victoryConfetti() {
        const randomNumberInMilliseconds = this.random(300, 1200);
        this.shoot();
        this.timeout = setTimeout(() => this.victoryConfetti(), randomNumberInMilliseconds);
    }
}
