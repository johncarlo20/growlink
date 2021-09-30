import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DosingRecipe, DeviceResponse, Controller, UnitOfMeasure } from '@models';
import { ControllerService, ProgressBarService } from '@services';
import { BaseAPIComponent } from '@util';

export interface DosingRecipeDialogOptions {
  deviceOptions: DeviceResponse[];
  controller: Controller;
}

@Component({
  selector: 'fuse-edit-dosing-recipe-dialog',
  templateUrl: './edit-dosing-recipe-dialog.component.html',
})
export class EditDosingRecipeDialogComponent extends BaseAPIComponent implements OnInit {
  editRecipeForm: FormGroup;
  recipe: DosingRecipe;
  dialogOptions: DosingRecipeDialogOptions;
  deviceOptions: DeviceResponse[];
  tdsUnit: UnitOfMeasure;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { recipe: DosingRecipe; dialogOptions: DosingRecipeDialogOptions },
    public dialogRef: MatDialogRef<EditDosingRecipeDialogComponent>,
    private controllerService: ControllerService,
    progressBarService: ProgressBarService,
    snackbar: MatSnackBar
  ) {
    super(snackbar, progressBarService);

    this.recipe = data.recipe;
    this.dialogOptions = data.dialogOptions;
    this.deviceOptions = this.dialogOptions.deviceOptions;
    this.tdsUnit = this.dialogOptions.controller.Units.tds;
  }

  ngOnInit() {
    super.ngOnInit();

    this.editRecipeForm = new FormGroup({
      name: new FormControl(this.recipe.Name),
      tds: new FormControl(this.recipe.TargetTds),
      scaleFactor: new FormControl(this.recipe.ScaleFactor * 100),
    });

    this.deviceOptions.forEach(device => {
      const controlKey = `ratio-${device.Guid}`;
      const excludeKey = `scaling-excluded-${device.Guid}`;
      const part = this.recipe.Parts.find(p => p.DeviceId === device.Guid);
      if (!this.editRecipeForm.contains(controlKey)) {
        this.editRecipeForm.addControl(
          controlKey,
          new FormControl(part ? part.MillilitersPerGallon : null)
        );
        this.editRecipeForm.addControl(
          excludeKey,
          new FormControl(part ? part.ExcludeFromScale : false)
        );
      }
    });

    this.subs.add(
      this.editRecipeForm.valueChanges.subscribe(() => {
        this.recipe.Name = this.name.value;
        this.recipe.TargetTds = this.tds.value;
        this.recipe.ScaleFactor = this.scaleFactor.value / 100;

        this.deviceOptions.forEach(device => {
          const ratioField = this.editRecipeForm.get(`ratio-${device.Guid}`);
          const excludeField = this.editRecipeForm.get(`scaling-excluded-${device.Guid}`);
          const part = this.recipe.Parts.find(p => p.DeviceId === device.Guid);
          if (ratioField.value !== null && !part) {
            // Add new part
            this.recipe.Parts.push({
              DeviceId: device.Guid,
              MillilitersPerGallon: ratioField.value,
              ExcludeFromScale: excludeField.value,
            });
          } else if (!ratioField.value && part) {
            // Remove the part
            this.recipe.Parts = this.recipe.Parts.filter(p => p.DeviceId !== device.Guid);
          } else if (part) {
            // Just update the value
            part.MillilitersPerGallon = ratioField.value;
            part.ExcludeFromScale = excludeField.value;
          }
        });
      })
    );
  }

  get name() {
    return this.editRecipeForm.get('name');
  }
  get tds() {
    return this.editRecipeForm.get('tds');
  }
  get scaleFactor() {
    return this.editRecipeForm.get('scaleFactor');
  }
  get tdsScaled() {
    if (!this.tds.value) { return 'N/A'; }

    const unscaled = parseFloat(this.tds.value);
    return Math.round((unscaled * this.scaleFactor.value)) / 100.0;
  }

  get tdsDisplayUnit(): string {
    switch (this.tdsUnit) {
      case UnitOfMeasure.PartsPerMillion:
        return 'ppm';
      case UnitOfMeasure.EC:
        return 'EC';
      default:
        return 'UNKNOWN';
    }
  }

  get scaleFactorValue(): string {
    if (this.scaleFactor.value > 0) {
      return `Scale By [${Math.round((this.scaleFactor.value * 100)) / 100}%]`;
    }

    return `Scale By [${this.scaleFactor.value}%]`;
  }

  public update() {
    if (!this.recipe.Id) {
      this.controllerService.createDosingRecipe(this.recipe, this.tdsUnit).subscribe(
        () => {
          this.showMessage(`Added new Dosing Recipe`);
          this.dialogRef.close(true);
        },
        error => this.handleError(error)
      );
    } else {
      this.controllerService.updateDosingRecipe(this.recipe, this.tdsUnit).subscribe(
        () => {
          this.showMessage(`Saved changes to Dosing Recipe`);
          this.dialogRef.close(true);
        },
        error => this.handleError(error)
      );
    }
  }

  scaledValue(device: DeviceResponse) {
    const part = this.recipe.Parts.find(p => p.DeviceId === device.Guid);
    if (part && !!part.MillilitersPerGallon) {
      if (part.MillilitersPerGallon > 0 && !part.ExcludeFromScale) {
        return `${Math.round((part.MillilitersPerGallon * this.scaleFactor.value)) / 100.0} ml/gal`;
      }

      return `${part.MillilitersPerGallon} ml/gal`;
    }

    return '';
  }

  isActive(device: DeviceResponse) {
    const part = this.recipe.Parts.find(p => p.DeviceId === device.Guid);
    if (part && part.MillilitersPerGallon > 0) {
      return { color: 'green' };
    }
    return { color: 'transparent' };
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
