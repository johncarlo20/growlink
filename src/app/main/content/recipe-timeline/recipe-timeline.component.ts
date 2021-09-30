import { 
  Component,
  ViewChild,
  ElementRef,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
  ProgressBarService,
} from '@services';
import { BaseAPIComponent } from '@util';

import GSTC, { Config, GSTCResult } from 'gantt-schedule-timeline-calendar';
import { Plugin as TimelinePointer } from 'gantt-schedule-timeline-calendar/dist/plugins/timeline-pointer.esm.min.js';
import { Plugin as Selection } from 'gantt-schedule-timeline-calendar/dist/plugins/selection.esm.min.js';
import { Plugin as ItemResizing } from 'gantt-schedule-timeline-calendar/dist/plugins/item-resizing.esm.min.js';
import { Plugin as ItemMovement } from 'gantt-schedule-timeline-calendar/dist/plugins/item-movement.esm.min.js';
//import { Plugin as TimeBookmarks } from 'gantt-schedule-timeline-calendar/dist/plugins/time-bookmarks.esm.min.js';
import { Plugin as ProgressBar } from 'gantt-schedule-timeline-calendar/dist/plugins/progress-bar.esm.min.js';
import { Plugin as HighlightWeekends } from 'gantt-schedule-timeline-calendar/dist/plugins/highlight-weekends.esm.min.js';
import { Plugin as DependencyLines } from 'gantt-schedule-timeline-calendar/dist/plugins/dependency-lines.esm.min.js';

import { environment } from 'environments/environment'

@Component({
  selector: 'fuse-recipe',
  templateUrl: './recipe-timeline.component.html',
  styleUrls: [
    './recipe-timeline-gantt.component.scss',
    './recipe-timeline.component.scss',
  ],
  encapsulation: ViewEncapsulation.None,
})
export class RecipeTimelineComponent extends BaseAPIComponent implements OnInit {
  @ViewChild('gstcElement', { static: true }) gstcElement: ElementRef;
  gstc: GSTCResult;

  openSidebar: boolean = false;

  constructor(
    snackbar: MatSnackBar,
    progressBarService: ProgressBarService
  ) {
    super(snackbar, progressBarService);
    this.progressBarService.SetCurrentPage([
      { icon: 'dashboard', caption: 'Organization Dashboard' },
    ]);
  }

  ngOnInit(): void {
    super.ngOnInit();

    this.gstc = GSTC({
      element: this.gstcElement.nativeElement,
      state: GSTC.api.stateFromConfig(this.generateConfig()),
    });
  }

  closeSidebar() {
    this.openSidebar = false;
  }

  generateConfig(): Config {
    const iterations = 400;
    // GENERATE SOME ROWS

    const rows = {};
    for (let i = 0; i < iterations; i++) {
      const withParent = i > 0 && i % 2 === 0;
      const id = GSTC.api.GSTCID(i.toString());
      rows[id] = {
        id,
        label: 'Task ' + i + 1,
        parentId: withParent ? GSTC.api.GSTCID((i - 1).toString()) : undefined,
        expanded: false,
      };
    }

    // GENERATE SOME ROW -> ITEMS

    let start = GSTC.api.date().startOf('day').subtract(30, 'day');
    const items = {};
    for (let i = 0; i < iterations; i++) {
      const id = GSTC.api.GSTCID(i.toString());
      start = start.add(1, 'day');
      items[id] = {
        id,
        label: 'Test task #' + i,
        time: {
          start: start.valueOf(),
          end: start.add(6, 'day').valueOf(),
        },
        rowId: id,
        height: 52
      };
    }

    // LEFT SIDE LIST COLUMNS

    const columns = {
      percent: 80,
      resizer: {
        inRealTime: true,
      },
      data: {
        [GSTC.api.GSTCID('label')]: {
          id: GSTC.api.GSTCID('label'),
          data: 'label',
          expander: true,
          isHtml: true,
          width: 225,
          minWidth: 100,
          header: {
            content: '',
          },
        },
      },
    };

    return {
      licenseKey: '====BEGIN LICENSE KEY====\nq6tDE4Qjn1qU3CHmffZqvHEwN0ActslFIuxCdWgN18QCHYVIWL2ArDnNKabL+Drv7JC5sWx3A2XwPShxMJDF5/cPZAimjFj+qAgKUR361lDFq0nhq2tH2OI2HBsdjcvQBEUF8Mj6oxO6bwHB5Bf2l14ooYGp0hEG9F8MN7b5m7/mDJcXp9mmLYwU5XaWLObRPi/Taog4aJJ4zAGf41z2vbcGurt7RifVMyyF2rNOvasBvxKdSBcKyddLNCGH1ptv6Pi+qUh5skl+cUnPIAz+01WAN+VGuX2zk2Tl87VLoZU2n5GtkASxcTgX62UfY9epYXjz3dGsHgd6otQQ1aDUmw==||U2FsdGVkX1+TbW4jeK3WmaJ8zzk7gbZiD1I/pUiT29kDOhseUzWcvrvKMvvDKJx6cARDuYjDqjrLP8cCRtccykQvKtToiVTwDKrDfMEFBcg=\nTUJch9kLwXD/yKCEWFvKlzZh4xr6OEUYPJQ40T3pHB6q9Ow7KqvLwbSTZp9AQHG2UWU53kgIAUtYtEULW6vfTgkvzOjp/voNhGfJWNIZbnoRAa53ENrz7qy6D4uqXiSuazXJnslWlnMEPmoQldtyDBCNS9aR46QBYSi9RE4JDV8NMKMvXt3B/d1A28tPYYGDWBGNo028hmGKxI+R40oapSiAovoHQShbVpJkQhldK6IVa5rC3EHR14HFKlweu9FEhzdHVCm+CxrMQcZ7uWWLQ+mmmowOKP/LunbgpPHyAFWSSRhMO27MS3S1lA1//cM+aNBQUbvsVgN7ikYbvtdcJA==\n====END LICENSE KEY====',
      list: {
        rows,
        columns,
      },
      chart: {
        items,
      },
      plugins: [
        TimelinePointer(), 
        Selection(),
        ItemResizing(),
        ItemMovement(),
        //TimeBookmarks(),
        //ProgressBar(),
        HighlightWeekends(),
        //DependencyLines()
      ],
    };
  }

  updateFirstItem(): void {
    this.gstc.state.update(
      `config.chart.items.${GSTC.api.GSTCID('0')}`,
      (item) => {
        item.label = 'Dynamically updated!';
        return item;
      }
    );
  }

  updateFirstRow(): void {
    this.gstc.state.update(
      `config.list.rows.${GSTC.api.GSTCID('0')}`,
      (row) => {
        row.label = 'Dynamically updated!';
        return row;
      }
    );
  }

  scrollToCurrentTime(): void {
    this.gstc.api.scrollToTime(GSTC.api.date().valueOf());
  }

  clearSelection(): void {
    this.gstc.api.plugins.selection.selectCells([]);
    this.gstc.api.plugins.selection.selectItems([]);
  }
}
