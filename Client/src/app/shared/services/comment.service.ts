import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { UserService } from './user.service';
import { ActivityService } from './activity.service';
import { IComment } from '../models/comment';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

const apiBase = environment.apiBaseUrl;

@Injectable({
  providedIn: 'root'
})
export class CommentService {

  constructor(
    private userService: UserService,
    private activityService: ActivityService,
    private http: HttpClient,
    private toastr: ToastrService) { }

  private hubConnection: HubConnection;

  startConnection() {

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(apiBase + 'chat', {
        accessTokenFactory: () => this.userService.user.token
      })
      .configureLogging(LogLevel.Information)
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log('Attempting to join group');
        this.hubConnection.invoke('AddToGroup', this.activityService.activity.id);
      })
      .then(() => console.log(this.hubConnection.state))
      .catch(err => console.log('Error while starting connection: ' + err));

    // Has to match the evetn sent by the Hub from ASP.NET
    this.hubConnection.on('RecieveComment', (comment: IComment) => {
      const currentActivity = {...this.activityService.activity};
      currentActivity.comments.push(comment);
      this.activityService.activity = currentActivity;
    });

    // This will be recieved once the gorup was joined
    this.hubConnection.on('Send', (message: string) => {
      this.toastr.info(message);
    });
  }

  stopConnection() {
    console.log(this.activityService.activity.id);
    this.hubConnection.invoke('RemoveFromGroup', this.activityService.activity.id)
      .then(() => this.hubConnection.stop())
      .then(() => console.log('Connection has stopped'))
      .catch(err => console.log(err));
  }

  addComment(values: { body: string, activityId: string }) {
    values.activityId = this.activityService.activity.id;

    return this.hubConnection.invoke('SendComment', values);
  }
}
