import { HeatmapGroup } from './heatmap-group';

export interface IHeatmapConfiguration {
  Id?: string;
  OrganizationId: string;
  BackgroundImageUrl?: string;
  Name: string;
  Groups?: HeatmapGroup[];
}

export class HeatmapConfiguration implements IHeatmapConfiguration {
  Id: string;
  OrganizationId: string;
  BackgroundImageUrl: string;
  Name: string;
  Groups: HeatmapGroup[] = [];

  // helpers
  width: number;
  height: number;

  constructor(config: Partial<IHeatmapConfiguration>) {
    this.Id = config.Id;
    this.OrganizationId = config.OrganizationId;
    this.BackgroundImageUrl = config.BackgroundImageUrl;
    this.Name = config.Name;

    if (config.Groups) {
      config.Groups.forEach(grp => this.Groups.push(new HeatmapGroup(grp)));
    }
  }
}
