import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { minidenticon } from 'minidenticons';

@Component({
    selector: 'app-player-avatar',
    templateUrl: './player-avatar.component.html',
    styleUrls: ['./player-avatar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerAvatarComponent {

    @Input()
    seed: string | undefined | null;

    @Input()
    height: number = 100;

    get src() {
        if (this.seed) {
            return 'data:image/svg+xml;utf8,' + encodeURIComponent(minidenticon(this.seed));
        }
        return undefined;

    }
}
