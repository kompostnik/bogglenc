import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalComponent {
    @Input()
    title!: string;
    @Input()
    icon!: string;
    @Input()
    iconClass!: string;

    constructor(public modalRef: BsModalRef) {

    }

}
