import { Component, inject, signal, WritableSignal } from '@angular/core';
import { NotificationsService } from '../../../shared/services/Notifications/notifications.service';
import { INotify } from '../../../core/models/Notifications/inotify.interface';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-notifications',
  imports: [DatePipe],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css',
})
export class NotificationsComponent {
  private _NotificationService = inject(NotificationsService);

  Notifications: WritableSignal<INotify[]> = signal([]);
  unreadCount: WritableSignal<number> = signal(0)

  ngOnInit(): void {
    this.GetNotifications();
    this.GetUnreadCount();
  }


  GetNotifications() {
    this._NotificationService.GetNotifications().subscribe({
      next: (res) => {
        this.Notifications.set(res.data.notifications);
        console.log(this.Notifications())
      },
      error: (err) => {
        console.log(err)
      }
    })
  }

  GetUnreadCount() {
    this._NotificationService.GetUnreadCount().subscribe({
      next: (res) => {
        this.unreadCount.set(res.data.unreadCount)
      },
      error: (err) => {
        console.log(err)
      }
    })
  }

  MarkNotificationAsRead(notificationId: string) {
    this._NotificationService.MarkNotificationAsRead(notificationId).subscribe({
      next: (res) => {
        console.log(res)
        this.GetNotifications()
        this.GetUnreadCount()
      },
      error: (err) => {
        console.log(err)
      }
    })
  }

  MarkAllNotificationsAsRead() {
    this._NotificationService.MarkAllNotificationsAsRead().subscribe({
      next: (res) => {
        console.log(res)
        this.GetNotifications()
        this.GetUnreadCount()
      },
      error: (err) => {
        console.log(err)
      }
    })
  }

}
