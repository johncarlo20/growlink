import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HeatmapGroup, ParticleSensor, SelectItem } from '@models';
import { ParticleSensorsService } from '@services';
import { BaseComponent } from '@util';
import { MappedSensor } from '../../org-rules/org-rules.models';

@Component({
  selector: 'fuse-heatmap-group-dialog',
  templateUrl: './heatmap-group-dialog.component.html',
  styleUrls: ['./heatmap-group-dialog.component.scss'],
})
export class HeatmapGroupDialogComponent extends BaseComponent implements OnInit {
  editGroupForm: FormGroup;
  group: HeatmapGroup;
  sensorTypes: SelectItem[] = [];
  sensorList: MappedSensor[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { group: HeatmapGroup; sensors: MappedSensor[] },
    private particleSensorService: ParticleSensorsService,
    public dialogRef: MatDialogRef<HeatmapGroupDialogComponent>
  ) {
    super();

    this.group = data.group;
    this.sensorList = data.sensors;
    const allSensorTypes = this.sensorList.reduce((all, sens) => {
      if (all.includes(sens.ParticleSensor)) {
        return all;
      }

      return all.concat(sens.ParticleSensor);
    }, new Array<ParticleSensor>());

    this.sensorTypes = this.particleSensorService.SelectList.filter(item =>
      allSensorTypes.includes(item.value)
    );
  }

  ngOnInit() {
    this.editGroupForm = new FormGroup({
      groupName: new FormControl(this.group.Name, [Validators.required]),
      min: new FormControl(this.group.MinReading, [Validators.required]),
      max: new FormControl(this.group.MaxReading, [Validators.required]),
      sensorType: new FormControl(this.group.ParticleSensor, [
        Validators.required,
        Validators.min(1),
      ]),
    });

    this.subs.add(
      this.editGroupForm.valueChanges.subscribe(() => {
        this.group.Name = this.groupName.value;
        this.group.MinReading = this.min.value;
        this.group.MaxReading = this.max.value;
        this.group.ParticleSensor = this.sensorType.value;
      })
    );

    if (!this.group.ParticleSensor && this.group.Sensors.length) {
      const sensorId = this.group.Sensors[0].SensorId;
      const sensor = this.sensorList.find(sens => sens.Guid === sensorId);
      if (sensor) {
        this.sensorType.setValue(sensor.ParticleSensor);
      }
    }
  }

  get groupName() {
    return this.editGroupForm.get('groupName') as FormControl;
  }
  get min() {
    return this.editGroupForm.get('min') as FormControl;
  }
  get max() {
    return this.editGroupForm.get('max') as FormControl;
  }
  get sensorType() {
    return this.editGroupForm.get('sensorType') as FormControl;
  }

  public update() {
    this.dialogRef.close({ group: this.group });
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
