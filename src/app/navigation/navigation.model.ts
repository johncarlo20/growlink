import { Subscription } from 'rxjs';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { FuseNavigation } from '@fuse/types';
import { ControllerService, AuthenticationService, OrganizationService } from '@services';
import { ControllerResponse } from '@models';

export class FuseNavigationModel {
  public model: FuseNavigation[] = [];

  private onOrgChanged: Subscription;
  private allControllers: ControllerResponse[] = [];

  constructor(
    private controllerService: ControllerService,
    private fuseNav: FuseNavigationService,
    private authenticationService: AuthenticationService,
    private organizationService: OrganizationService
  ) {
    this.model = [
      {
        id: 'orgName',
        title: 'Organization',
        type: 'group',
        children: [
          {
            id: 'org',
            title: 'Organization',
            icon: 'business_center',
            type: 'collapsable',
            children: [
              {
                id: `orgdashboard`,
                title: 'Dashboard',
                //icon: 'dashboard',
                type: 'item',
                url: `/home`,
              },
              {
                id: `orgdashboard1`,
                title: 'Room Dashboard',
                //icon: 'dashboard',
                type: 'item',
                url: `/room`,
              },
              {
                id: `crop_groups`,
                title: 'Crop Groups',
                //icon: 'dashboard',
                type: 'item',
                url: `/crop_groups`,
              },

              {
                id: `recipes`,
                title: 'Recipes',
                //icon: 'dashboard',
                type: 'item',
                url: `/recipes`,
              },

              {
                id: `crop_groups`,
                title: 'Tasks',
                //icon: 'dashboard',
                type: 'item',
                url: `/tasks`,
              },
             
              // {
              //   id: `orgrules`,
              //   title: 'Rules',
              //   icon: 'settings',
              //   type: 'item',
              //   url: `/org/rules`
              // },
              {
                id: `heatmaps`,
                title: 'Heat Maps',
                //icon: 'insert_chart',
                type: 'item',
                url: `/heat-maps`,
              },
              {
                id: `dashboards`,
                title: 'Custom Dashboards',
                //icon: 'assessment',
                type: 'item',
                url: `/org/dashboards`,
              },
              {
                id: `batch-tanks`,
                title: 'Batch Tanks',
                //icon: 'assessment',
                type: 'item',
                url: `/batch-tanks`,
              },
              {
                id: `calendar`,
                title: 'Calendar',
                //icon: 'assessment',
                type: 'item',
                url: `/calendar`,
              },
              {
                id: `harvests`,
                title: 'Harvests',
                //icon: 'assessment',
                type: 'item',
                url: `/harvests`,
              },
              {
                id: `calendar-irrigation-event-edit`,
                title: 'Update Irrigation Event',
                //icon: 'assessment',
                type: 'item',
                url: `/calendar/irrigation-event-edit`,
              },
              {
                id: `reports`,
                title: 'Reports',
                //icon: 'insert_chart',
                type: 'item',
                url: `/org/reports/calibration`,
              },
              {
                id: `nutrient`,
                title: 'Nutrient',
                //icon: 'insert_chart',
                type: 'item',
                url: `/nutrient`,
              },
            ],
          },
          {
            id: 'controllers',
            title: 'Controllers',
            icon: 'apps',
            type: 'collapsable',
            children: [],
          },
        ],
      },
    ];
    if (this.authenticationService.token) {
      this.getControllers();
    }
    this.authenticationService.User.subscribe((user) => {
      if (this.onOrgChanged) {
        this.onOrgChanged.unsubscribe();
      }

      if (!user) {
        return;
      }

      this.model[0].title = user.Company || 'Company Name';

      if (user.IsDomainAdmin) {
        this.onOrgChanged = this.authenticationService.OrganizationIdChanged.subscribe(() => {
          this.loadMenu();
        });
      }
    });

    this.authenticationService.updatedToken.subscribe((t) => {
      this.getControllers();
    });

    this.organizationService.activeSubscription.subscribe((orgSub) => {
      this.loadMenu();
    });
  }

  getControllers(): void {
    this.controllerService.getControllers().subscribe((c) => {
      this.processGetControllersResponse(c);
    });
  }

  private processGetControllersResponse(controllers: ControllerResponse[]): void {
    // if (controllers.some(c => !c.HasPaidSubscription)) {
    // 	this.displayPaidModule = true;
    // 	return;
    // }
    this.allControllers = controllers.sort((a, b) => a.Name.localeCompare(b.Name));

    this.loadMenu();
  }

  private loadMenu(): void {
    if (!this.fuseNav.getCurrentNavigation()) {
      return;
    }

    const orgMenuItem = this.model[0].children.find((heading) => heading.id === 'org');
    orgMenuItem.type = this.organizationService.validSubscription ? 'collapsable' : 'item';
    this.fuseNav.updateNavigationItem('org', orgMenuItem);

    const controllerMenuItem = this.model[0].children.find(
      (heading) => heading.id === 'controllers'
    );
    controllerMenuItem.children.forEach((child) => {
      this.fuseNav.removeNavigationItem(child.id);
    });
    controllerMenuItem.children = [];

    const orgFilteredControllers = this.allControllers.filter(
      (c) =>
        !this.authenticationService.currentUser.IsDomainAdmin ||
        !c.OrganizationId ||
        c.OrganizationId === this.authenticationService.currentUser.OrganizationId
    );

    orgFilteredControllers.forEach((c) => {
      const controllerChildren: FuseNavigation = {
        id: c.Id,
        title: c.Name,
        type: 'collapsable',
        icon: 'business',
        children: [],
      };
      if (this.organizationService.validSubscription) {
        controllerChildren.children = [
          {
            id: `dashboard${c.Id}`,
            title: 'Dashboard',
            type: 'item',
            url: `/controller/${c.Id}/dashboard/${
              c.DefaultDashboardId ? c.DefaultDashboardId : 'generated'
            }`,
            exactMatch: false,
          },
          {
            id: `modules${c.Id}`,
            title: 'Modules',
            type: 'item',
            url: `/controller/${c.Id}/modules`,
          },
          {
            id: `rules${c.Id}`,
            title: 'Rules',
            type: 'item',
            url: `/controller/${c.Id}/rules`,
          },
          {
            id: `journal${c.Id}`,
            title: 'Journal',
            type: 'item',
            url: `/controller/${c.Id}/journal`,
          },
          {
            id: `profile${c.Id}`,
            title: 'Profile',
            type: 'item',
            url: `/controller/${c.Id}/profile`,
          },
        ];

        if (c.EnableInlineDosing) {
          controllerChildren.children.push({
            id: `dosing-recipes${c.Id}`,
            title: 'Dosing Recipes',
            type: 'item',
            url: `/controller/${c.Id}/dosing-recipes`,
          });
        }
        if (c.EnableMotorControls) {
          controllerChildren.children.push({
            id: `motor-controls${c.Id}`,
            title: 'Motor Controls',
            type: 'item',
            url: `/controller/${c.Id}/motor-controls`,
          });
        }
      }

      controllerMenuItem.children.push(controllerChildren);
    });

    this.fuseNav.updateNavigationItem('controllers', controllerMenuItem);
  }
}
