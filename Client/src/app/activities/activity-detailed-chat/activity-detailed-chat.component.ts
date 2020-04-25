import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommentService } from 'src/app/shared/services/comment.service';
import { ActivityService } from 'src/app/shared/services/activity.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-activity-detailed-chat',
  templateUrl: './activity-detailed-chat.component.html',
  styleUrls: ['./activity-detailed-chat.component.scss']
})
export class ActivityDetailedChatComponent implements OnInit, OnDestroy {

  constructor(private commentService: CommentService, public activityService: ActivityService) { }

  commentFormValues = {
    body: ''
  };
  loading = false;

  ngOnInit() {
    this.commentService.startConnection();
  }

  ngOnDestroy() {
    this.commentService.stopConnection();
  }

  async submitComment(form: NgForm) {
    this.loading = true;

    try {
      await this.commentService.addComment(form.value);
      this.loading = false;
      form.reset();
    } catch (error) {
      this.loading = false;
    }
  }
}
