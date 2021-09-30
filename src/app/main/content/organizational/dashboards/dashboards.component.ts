import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';
import 'moment-timezone';

@Component({
  selector: 'fuse-org-dashboards',
  templateUrl: './dashboards.component.html',
  styleUrls: ['./dashboards.component.scss']
})
export class OrgDashboardsComponent {
  constructor(private route: ActivatedRoute) { }

  get DashboardId(): Observable<string> {
    return this.route.params.pipe(pluck('guid'));
  }
}
