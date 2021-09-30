import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProductTypeResponse } from '@models';
import { ProgressBarService } from './progress-bar.service';

@Injectable()
export class ProductTypesService {
  private productTypes: ProductTypeResponse[] = [];

  constructor(private http: HttpClient, private progressBarService: ProgressBarService) {
    this.loadProductTypes();
  }

  private loadProductTypes(): void {
    const cache = sessionStorage.getItem('productTypes');
    if (cache !== null && cache.length) {
      this.productTypes = JSON.parse(cache);
    }

    this.progressBarService.SetLoading(true);
    this.http.get<ProductTypeResponse[]>('api/ProductTypes')
      .subscribe(r => {
        this.progressBarService.SetLoading(false);
        this.productTypes = r;
        sessionStorage.setItem('productTypes', JSON.stringify(r));
      });
  }

  public FindProductType(productType: number) {
    return this.productTypes.find(pt => pt.Id === productType);
  }
}
