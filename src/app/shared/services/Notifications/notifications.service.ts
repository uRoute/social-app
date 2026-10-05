import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private _HttpClient = inject(HttpClient);

  GetNotifications(): Observable<any> {
    return this._HttpClient.get(`${environment.baseURL}/notifications`);
  }
  GetUnreadCount(): Observable<any> {
    return this._HttpClient.get(`${environment.baseURL}/notifications/unread-count`);
  }

  MarkNotificationAsRead(notificationId: string): Observable<any> {
    return this._HttpClient.patch(`${environment.baseURL}/notifications/${notificationId}/read`, null);
  }

  MarkAllNotificationsAsRead(): Observable<any> {
    return this._HttpClient.patch(`${environment.baseURL}/notifications/read-all`, null);
  }
}
