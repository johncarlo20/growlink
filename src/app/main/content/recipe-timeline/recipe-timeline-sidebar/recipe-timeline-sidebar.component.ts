import { 
  Component,
  OnInit,
  ViewEncapsulation,
  Input,
  Output, 
  EventEmitter 
} from '@angular/core';

@Component({
  selector: 'recipe-timeline-sidebar',
  templateUrl: './recipe-timeline-sidebar.component.html',
  styleUrls: [
    './recipe-timeline-sidebar.component.scss',
  ],
  encapsulation: ViewEncapsulation.None,
})
export class RecipeTimelineSidebarComponent implements OnInit {
  @Input() openSidebar: boolean;
  @Output() sidebarClosed = new EventEmitter<boolean>();

  constructor() {
  }

  ngOnInit(): void {
  }

  closeSidebar() {
    this.openSidebar = false;
    this.sidebarClosed.emit(false);
  }

}
