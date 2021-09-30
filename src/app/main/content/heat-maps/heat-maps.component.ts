import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
  ProgressBarService,
} from '@services';
import { BaseAPIComponent } from '@util';

@Component({
  selector: 'fuse-heat-map',
  templateUrl: './heat-maps.component.html',
  styleUrls: ['./heat-maps.component.scss'],
})
export class HeatMapsComponent extends BaseAPIComponent implements OnInit {

  items: Array<any> = [
    {
      sensor: 'Canopy Temp (°F)', 
      fertigation: 'Hydrogen', 
      flower01canopy: 72.08, 
      flower01: '--',
      flower01canopy1: 72.08, 
      flower01canopy2: 68.08, 
      flower01canopy3: '--',
      flower01canopy4: 20.05,
      flower01canopy5: '--',
      flower01canopy6: '--',
      flower01canopy7: 14.05,
      flower01canopy8: 29.08
    },
    {
      sensor: 'Canopy Temp (°F)', 
      fertigation: 'Hydrogen', 
      flower01canopy: 72.08, 
      flower01: '--',
      flower01canopy1: 72.08, 
      flower01canopy2: 68.08, 
      flower01canopy3: '--',
      flower01canopy4: 20.05,
      flower01canopy5: '--',
      flower01canopy6: '--',
      flower01canopy7: 14.05,
      flower01canopy8: 29.08
    },
    {
      sensor: 'Canopy Temp (°F)', 
      fertigation: 'Hydrogen', 
      flower01canopy: 72.08, 
      flower01: '--',
      flower01canopy1: 72.08, 
      flower01canopy2: 68.08, 
      flower01canopy3: '--',
      flower01canopy4: 20.05,
      flower01canopy5: '--',
      flower01canopy6: '--',
      flower01canopy7: 14.05,
      flower01canopy8: 29.08
    },
    {
      sensor: 'Canopy Temp (°F)', 
      fertigation: 'Hydrogen', 
      flower01canopy: 72.08, 
      flower01: '--',
      flower01canopy1: 72.08, 
      flower01canopy2: 68.08, 
      flower01canopy3: '--',
      flower01canopy4: 20.05,
      flower01canopy5: '--',
      flower01canopy6: '--',
      flower01canopy7: 14.05,
      flower01canopy8: 29.08
    },
    {
      sensor: 'Canopy Temp (°F)', 
      fertigation: 'Hydrogen', 
      flower01canopy: 72.08, 
      flower01: '--',
      flower01canopy1: 72.08, 
      flower01canopy2: 68.08, 
      flower01canopy3: '--',
      flower01canopy4: 20.05,
      flower01canopy5: '--',
      flower01canopy6: '--',
      flower01canopy7: 14.05,
      flower01canopy8: 29.08
    },
    {
      sensor: 'Canopy Temp (°F)', 
      fertigation: 'Hydrogen', 
      flower01canopy: 72.08, 
      flower01: '--',
      flower01canopy1: 72.08, 
      flower01canopy2: 68.08, 
      flower01canopy3: '--',
      flower01canopy4: 20.05,
      flower01canopy5: '--',
      flower01canopy6: '--',
      flower01canopy7: 14.05,
      flower01canopy8: 29.08
    },
    {
      sensor: 'Canopy Temp (°F)', 
      fertigation: 'Hydrogen', 
      flower01canopy: 72.08, 
      flower01: '--',
      flower01canopy1: 72.08, 
      flower01canopy2: 68.08, 
      flower01canopy3: '--',
      flower01canopy4: 20.05,
      flower01canopy5: '--',
      flower01canopy6: '--',
      flower01canopy7: 14.05,
      flower01canopy8: 29.08
    },
    {
      sensor: 'Canopy Temp (°F)', 
      fertigation: 'Hydrogen', 
      flower01canopy: 72.08, 
      flower01: '--',
      flower01canopy1: 72.08, 
      flower01canopy2: 68.08, 
      flower01canopy3: '--',
      flower01canopy4: 20.05,
      flower01canopy5: '--',
      flower01canopy6: '--',
      flower01canopy7: 14.05,
      flower01canopy8: 29.08
    },
    {
      sensor: 'Canopy Temp (°F)', 
      fertigation: 'Hydrogen', 
      flower01canopy: 72.08, 
      flower01: '--',
      flower01canopy1: 72.08, 
      flower01canopy2: 68.08, 
      flower01canopy3: '--',
      flower01canopy4: 20.05,
      flower01canopy5: '--',
      flower01canopy6: '--',
      flower01canopy7: 14.05,
      flower01canopy8: 29.08
    }
  ];

  displayedColumns: string[] = [
    'sensor', 
    'fertigation',
    'flower01canopy', 
    'flower01',
    'flower01canopy1',
    'flower01canopy2',
    'flower01canopy3',
    'flower01canopy4',
    'flower01canopy5',
    'flower01canopy6',
    'flower01canopy7',
    'flower01canopy8'
  ];

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
  }
}
