import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EnumDetails, ParticleDevice } from '@models';

@Injectable()
export class ParticleDevicesService {
  private particleDevices: EnumDetails[] = [];

  constructor(private http: HttpClient) {
    this.loadParticleDevices();
  }

  private loadParticleDevices(): void {
    const cache = sessionStorage.getItem('particleDevices');
    if (cache !== null && cache.length) {
      this.particleDevices = JSON.parse(cache);
    }

    this.http.get<EnumDetails[]>('api/ParticleDevices')
      .subscribe(r => {
        this.particleDevices = r;
        this.particleDevices.sort((a, b) => a.SortId - b.SortId);
        sessionStorage.setItem('particleDevices', JSON.stringify(this.particleDevices));
      });
  }

  public FindParticleDevice(deviceType: ParticleDevice) {
    return this.particleDevices.find(pd => pd.Id === deviceType);
  }
}
