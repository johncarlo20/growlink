import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProgressBarService, HeatmapService, AuthenticationService } from '@services';
import { HeatmapConfiguration } from '@models';
import { BaseAPIComponent } from '@util';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'fuse-heatmaps-list',
  templateUrl: './heatmaps-list.component.html',
  styleUrls: ['./heatmaps-list.component.scss'],
})
export class HeatmapsListComponent extends BaseAPIComponent implements OnInit {
  heatmapList: HeatmapConfiguration[] = [];
  organizationId: string;

  constructor(
    private router: Router,
    private heatmaps: HeatmapService,
    private auth: AuthenticationService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);

    this.progressBarService.SetCurrentPage([{ icon: 'insert_chart', caption: 'Heat Maps' }]);
  }

  ngOnInit() {
    super.ngOnInit();

    this.subs.add(
      this.auth.OrganizationIdChanged.subscribe(orgId => {
        this.organizationId = orgId;
        this.heatmaps
          .getHeatmaps(orgId)
          .subscribe(maps => (this.heatmapList = maps), error => this.handleError(error));
      })
    );
  }

  addHeatmap() {
    this.router.navigate(['org', 'heatmaps', 'config']);
  }

  viewHeatmap(id: string) {
    this.router.navigate(['org', 'heatmaps', id]);
  }

  editHeatmap(id: string) {
    this.router.navigate(['org', 'heatmaps', 'config', id]);
  }

  deleteHeatmap(id: string) {
    this.heatmaps.deleteHeatmap(id).subscribe(() => {
      this.heatmapList = [...this.heatmapList.filter(exist => exist.Id !== id)];
    });
  }

  environmentAPI(url: string) {
    return environment.api + url;
  }
}
