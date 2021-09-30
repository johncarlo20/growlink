import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
  selector: 'fuse-config-update-toast',
  templateUrl: './config-update-toast.component.html',
  styleUrls: ['./config-update-toast.component.scss']
})
export class ConfigUpdateToastComponent {
  constructor(@Inject(MAT_SNACK_BAR_DATA) public message: string) { }
}
