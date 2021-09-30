import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/table';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ControllerService, ProgressBarService } from '@services';
import {
  Controller,
  DosingRecipeResponse,
  DeviceResponse,
  DeviceTypes,
  DosingRecipe,
} from '@models';
import { BaseAPIComponent } from '@util';
import {
  DosingRecipeDialogOptions,
  EditDosingRecipeDialogComponent,
} from './edit-dosing-recipe-dialog.component';
import { UploadConfirmDialogComponent } from '../upload-confirm/upload-confirm-dialog.component';

@Component({
  selector: 'fuse-dosing-recipes',
  templateUrl: './dosing-recipes.component.html',
  styleUrls: ['./dosing-recipes.component.scss'],
})
export class DosingRecipesComponent extends BaseAPIComponent implements OnInit {
  controller: Controller = new Controller();
  dosingRecipes = new DosingRecipesDataSource();
  dosingDevices = new Array<DeviceResponse>();
  isReadOnly = true;
  changes = false;

  recipeColumns = ['name', 'devices', 'actions'];

  constructor(
    private controllerService: ControllerService,
    public dialog: MatDialog,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);
  }

  ngOnInit() {
    super.ngOnInit();

    this.subs.add(
      this.controllerService.currentContainer.subscribe(c => {
        this.updateController(c);
      })
    );
  }

  canDeactivate(): boolean | Observable<boolean> | Promise<boolean> {
    if (!this.changes) {
      return true;
    }

    const config: MatDialogConfig = {
      data: { msg: 'There are changes that have been made to the dosing recipes which have not been uploaded to the controller.' },
      disableClose: true,
    };

    const dialogRef = this.dialog.open(UploadConfirmDialogComponent, config);

    return dialogRef.afterClosed().pipe(
      tap((result: boolean) => {
        if (!result) {
          this.progressBarService.SetLoading(false);
        }
      })
    );
  }

  addDosingRecipe() {
    if (this.isReadOnly || this.loading) {
      return;
    }

    const newRecipe = new DosingRecipe();
    newRecipe.ControllerId = this.controller.Guid;
    newRecipe.ScaleFactor = 1;

    this.showEditRecipeDialog(newRecipe);
  }

  editDosingRecipe(recipe: DosingRecipeResponse) {
    if (this.isReadOnly || this.loading) {
      return;
    }

    const editRecipe = DosingRecipe.GetDosingRecipe(this.controller, recipe);

    this.showEditRecipeDialog(editRecipe);
  }

  deleteDosingRecipe(recipe: DosingRecipeResponse) {
    if (window.confirm(`Delete Dosing Recipe '${recipe.Name}'?`)) {
      this.controllerService.deleteDosingRecipe(recipe.Id).subscribe(
        () => {
          this.reloadController();
          this.showMessage(`Deleted Dosing Recipe ${recipe.Name}`);
          this.changes = true;
        },
        error => this.handleError(error)
      );
    }
  }

  getDeviceNames(recipe: DosingRecipeResponse): string {
    return recipe.Parts.map(part => {
      const dev = this.dosingDevices.find(d => d.Guid === part.DeviceId);
      return dev ? dev.Name : '<UNKNOWN>';
    }).join(', ');
  }

  pushControllerUpdate(): void {
    this.controllerService.updateConfig().subscribe(
      r => {
        this.showMessage(`Controller update pushed`);
        this.changes = false;
      },
      error => this.handleError(error)
    );
  }

  reloadController() {
    this.controllerService
      .setCurrentController(this.controller.Guid, true)
      .subscribe(
        result => this.controllerService.updateController(result),
        error => this.handleError(error)
      );
  }

  private updateController(controller: Controller): void {
    this.progressBarService.SetCurrentPage([
      {
        icon: 'business',
        caption: controller.Name,
        url: ['controller', controller.Guid, 'dashboard'],
      },
      { icon: 'device_hub', caption: 'Dosing Recipes' },
    ]);

    if (!controller || !controller.Guid) {
      return;
    }

    this.controller = controller;
    this.isReadOnly = controller.isReadOnly;

    this.dosingDevices = [];
    this.controller.Modules.forEach(mod => {
      this.dosingDevices = this.dosingDevices.concat(
        // TODO: Confirm logic for which devices qualify
        mod.Devices.filter(dev => dev.DeviceType === DeviceTypes.DosingPumpInline)
      );
    });

    this.dosingRecipes.update(this.controller.DosingRecipes);
  }

  private showEditRecipeDialog(recipe: DosingRecipe) {
    const dialogOptions: DosingRecipeDialogOptions = {
      deviceOptions: this.dosingDevices,
      controller: this.controller,
    };

    const config: MatDialogConfig = {
      panelClass: 'edit-module-panel',
      data: { recipe, dialogOptions },
    };

    const dialogRef = this.dialog.open(EditDosingRecipeDialogComponent, config);

    dialogRef.afterClosed().subscribe((result: { recipe: DosingRecipe }) => {
      if (!result) {
        return;
      }

      this.reloadController();
      this.changes = true;
    });
  }
}

class DosingRecipesDataSource implements DataSource<DosingRecipeResponse> {
  private data: BehaviorSubject<DosingRecipeResponse[]>;

  constructor(initialData?: DosingRecipeResponse[]) {
    this.data = new BehaviorSubject<DosingRecipeResponse[]>(initialData);
  }

  get Data(): Observable<DosingRecipeResponse[]> {
    return this.data.asObservable();
  }
  connect(): Observable<DosingRecipeResponse[]> {
    return this.data.asObservable();
  }

  update(newData?: DosingRecipeResponse[]): void {
    this.data.next(newData);
  }

  disconnect(): void {
    this.data.complete();
  }
}
