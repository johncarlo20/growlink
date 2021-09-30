import { Component, Optional } from "@angular/core";
import { MatSnackBar } from '@angular/material/snack-bar';
import { BaseAPIComponent } from '@util';
import { Dashboard, GenerationStatus } from '@models';
import { ProgressBarService } from '@services';

@Component({template: ''})
export abstract class AddWidgetDialog extends BaseAPIComponent {
  protected curPos: GenerationStatus;

  constructor(
    protected dashboard: Dashboard,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);
  }

  protected getDashboardAvailableSpot(widgetWidth: number, widgetHeight: number)
  {
    // console.log('curPos', this.curPos);
    // console.log('Requested Size', widgetWidth, widgetHeight);

    let xPos = this.curPos.x;
    let yPos = this.curPos.y;
    let fits = true;
    const maxY = Math.max(...this.dashboard.Items.map(item => item.y + item.rows));
    while (yPos <= maxY) {
      while (xPos + 3 < this.curPos.availColumns) {
        fits = true;
        for (let y = 0; y < widgetHeight; y++) {
          for (let x = 0; x < widgetWidth; x++) {
            const testX = xPos + x;
            const testY = yPos + y;

            this.dashboard.Items.forEach(item => {
              if (testX >= item.x && testX < item.x + item.cols && testY >= item.y && testY < item.y + item.rows) {
                fits = false;
              }
            });

            if (!fits) { break; }
          }

          if (!fits) { break; }
        }

        if (fits) { break; }

        xPos++;
      }

      if (fits) { break; }

      yPos++;
      xPos = this.curPos.x;
    }

    // console.log('Calculated Position', xPos, yPos);
    return {xPos, yPos};
  }
}
