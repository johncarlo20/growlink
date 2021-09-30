import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { CustomerResponse, CustomerRegistration, Customer } from '@models';
import { ProgressBarService } from './progress-bar.service';

@Injectable()
export class CustomerService {
  private basePath = 'api/customers';

  constructor(private http: HttpClient, private progressBarService: ProgressBarService) {
  }

  getCustomers(): Observable<CustomerResponse[]> {
    this.progressBarService.SetLoading(true);
    return this.http.get<CustomerResponse[]>(this.basePath).pipe(
      finalize(() => this.progressBarService.SetLoading(false))
    );
  }

  createCustomer(customer: CustomerRegistration): Observable<object> {
    this.progressBarService.SetLoading(true);
    return this.http.post(this.basePath, customer).pipe(
      finalize(() => this.progressBarService.SetLoading(false))
    );
  }

  deleteCustomer(id: string): Observable<object> {
    this.progressBarService.SetLoading(true);
    return this.http.delete(`${this.basePath}/${id}`).pipe(
      finalize(() => this.progressBarService.SetLoading(false))
    );
  }

  updateCustomer(customer: Customer, id: string): Observable<object> {
    this.progressBarService.SetLoading(true);
    return this.http.put(`${this.basePath}/${id}`, customer).pipe(
      finalize(() => this.progressBarService.SetLoading(false))
    );
  }

  getMyCustomer(): Observable<CustomerResponse> {
    this.progressBarService.SetLoading(true);
    return this.http.get<CustomerResponse>(`${this.basePath}/Me`).pipe(
      finalize(() => this.progressBarService.SetLoading(false))
    );
  }
}
