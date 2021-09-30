import { DataSource } from '@angular/cdk/table';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export class GenericDataSource<T> implements DataSource<T> {
  private data: BehaviorSubject<T[]>;

  constructor(initialData?: T[]) {
    this.data = new BehaviorSubject<T[]>([]);
    this.update(initialData);
  }

  get Data(): Observable<T[]> {
    return this.data.asObservable();
  }
  get Count(): Observable<number> {
    return this.data.pipe(map(items => items.length));
  }
  get Current(): T[] {
    return this.data.value;
  }
  connect(): Observable<T[]> {
    return this.data.asObservable();
  }

  update(newData?: T[]): void {
    this.data.next(newData);
  }

  disconnect(): void {
    this.data.complete();
  }
}
