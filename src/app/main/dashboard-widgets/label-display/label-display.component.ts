import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { LabelWidgetOptions } from '@models';

@Component({
  selector: 'fuse-label-display',
  templateUrl: './label-display.component.html',
  styleUrls: ['./label-display.component.scss'],
})
export class LabelDisplayComponent implements OnInit, OnDestroy {
  @Input() caption: string;
  @Input() options: LabelWidgetOptions;
  constructor() {}

  ngOnInit() {}
  ngOnDestroy() {}
}
