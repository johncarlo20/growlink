import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { CustomerResponse, BooleanResult } from '@models';
import { CustomerService } from './customer.service';
import { environment } from '../../../environments/environment';

interface StoredUser {
  user: CustomerResponse;
  token: string;
}

const StoredUserTokenName = 'Growlink.CurrentUser';

@Injectable()
export class AuthenticationService {
  private user = new BehaviorSubject<CustomerResponse>(new CustomerResponse());
  private selectedOrganizationId = new BehaviorSubject<string>(null);
  private tokenSubject = new BehaviorSubject<string>(null);

  public updatedToken = this.tokenSubject.asObservable();
  public OrganizationIdChanged = this.selectedOrganizationId.asObservable();
  public User = this.user.asObservable();
  public get token(): string {
    return this.tokenSubject.value;
  }
  public get currentUser() {
    return this.user.value;
  }

  constructor(private http: HttpClient, private customerService: CustomerService) {
    const currentUserStored = localStorage.getItem(StoredUserTokenName);
    if (currentUserStored) {
      const currentUser: StoredUser = JSON.parse(currentUserStored);
      const user = currentUser && currentUser.user;
      const tokenStr = currentUser && currentUser.token;

      this.tokenSubject.next(tokenStr);
      this.user.next(user);
      this.selectedOrganizationId.next(user.OrganizationId);
    }
  }

  login(username: string, password: string): Observable<BooleanResult> {
    // change URL if using inmemory API
    if (environment.api) {
      const loginBody = `grant_type=password&username=${username}&password=${password}`;

      return this.http
        .post('token', loginBody, { observe: 'response' })
        .pipe(map((res) => this.handleSuccess(res)));
    } else {
      return this.http
        .get('api/token', { observe: 'response' })
        .pipe(map((res) => this.handleSuccess(res)));
    }
  }

  logout(): void {
    localStorage.removeItem(StoredUserTokenName);
    this.user.next(new CustomerResponse());
    this.selectedOrganizationId.next(null);
    this.tokenSubject.next(null);
  }

  requestPasswordReset(username: string): Observable<boolean> {
    return this.http.post('api/PasswordResetRequests', { username }).pipe(map(() => true));
  }

  resetPassword(username: string, token: string, newPassword: string): Observable<boolean> {
    const resetBody = {
      Username: username,
      Token: token,
      NewPassword: newPassword,
    };

    return this.http.post('api/PasswordResets', resetBody).pipe(map(() => true));
  }

  setUser(user: CustomerResponse): void {
    const storedUser: StoredUser = {
      user: user,
      token: this.token,
    };

    localStorage.setItem(StoredUserTokenName, JSON.stringify(storedUser));

    this.user.next(user);
    if (user) {
      this.selectedOrganizationId.next(user.OrganizationId);
    }
  }

  updateLoggedInUser() {
    const currentUserStored = localStorage.getItem(StoredUserTokenName);
    if (currentUserStored) {
      const currentUser: StoredUser = JSON.parse(currentUserStored);
      const user = currentUser && currentUser.user;

      this.customerService.getMyCustomer().subscribe(
        (result) => this.handleSuccessfulLogin(result),
        (error) => this.handleNonAdmin(user.EmailAddress, error)
      );
    }
  }

  updateSelectedOrg(id: string): void {
    const curUser: CustomerResponse = { ...this.user.value };
    curUser.OrganizationId = id;

    this.setUser(curUser);
  }

  handleSuccessfulLogin(user: CustomerResponse): void {
    this.setUser({ ...user, OrganizationId: user.OrganizationId });
  }

  handleNonAdmin(username: string, error: string[]): void {
    const user: CustomerResponse = new CustomerResponse();
    user.EmailAddress = username;
    user.IsDomainAdmin = false;
    user.IsOrganizationAdmin = false;
    user.IsReadOnlyAdmin = false;
    this.setUser(user);
  }

  private handleSuccess(response: HttpResponse<Object>): BooleanResult {
    const returnResult = new BooleanResult();
    returnResult.success = false;
    const resData: any = response.body;
    if (!response.ok) {
      returnResult.message =
        (resData && resData.error_description) || 'Invalid user name or password.';
      return returnResult;
    } else {
      const tokenStr = resData && resData.access_token;
      if (tokenStr) {
        this.tokenSubject.next(tokenStr);
        returnResult.success = true;
        return returnResult;
      }
      returnResult.message = 'Unknown error processing response.';
      return returnResult;
    }
  }

  private handleError(error: HttpResponse<Object> | any) {
    const returnResult = new BooleanResult();
    returnResult.success = false;
    console.log(error);
    // if (error) {
    //   const body: any = error.json() || '';
    //   const err = body.error_description || body.error || JSON.stringify(body);
    //   returnResult.message = body.error_description ? err : `${error.status} - ${error.statusText || ''} ${err}`;
    // } else {
    //   returnResult.message = error.message ? error.message : error.toString() || 'Unknown error.';
    // }
    return Observable.throw(returnResult);
  }
}
