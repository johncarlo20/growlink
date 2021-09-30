import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { StripeInvoiceResponse } from '../models/stripe-invoice-response';

@Component({
  selector: 'fuse-payment-history',
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.scss']
})
export class PaymentHistoryComponent implements OnInit, AfterViewInit, OnDestroy {
  historyData = new BillingHistoryDataSource([]);
  displayedColumns = ['number', 'total', 'date', 'status', 'paid', 'paidDate', 'pdfURL'];

  private subs = new Subscription();

  @Input() pagination = false;
  @Input()
  set history(data: StripeInvoiceResponse[]) {
    this.historyData.data = data;
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor() { }

  ngOnInit() {
  }

  ngOnDestroy() {
    if (this.subs) {
      this.subs.unsubscribe();
    }
  }

  ngAfterViewInit() {
    if (this.pagination) {
      this.historyData.paginator = this.paginator;
    }
  }
}

class BillingHistoryDataSource extends MatTableDataSource<StripeInvoiceResponse> {
  // private data: BehaviorSubject<StripeInvoiceResponse[]>;

  // constructor(initialData?: StripeInvoiceResponse[]) {
  //   this.Data = new BehaviorSubject<StripeInvoiceResponse[]>(initialData);
  // }

  // get Data(): Observable<StripeInvoiceResponse[]> {
  //   return this.data.asObservable();
  // }
  // connect(): Observable<StripeInvoiceResponse[]> {
  //   return this.data.asObservable();
  // }

  // update(newData?: StripeInvoiceResponse[]): void {
  //   this.data.next(newData);
  // }

  // disconnect(): void {
  //   this.data.complete();
  // }
}

