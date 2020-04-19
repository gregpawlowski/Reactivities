import { Component, OnInit, Input } from '@angular/core';
import { IActivity } from 'src/app/shared/models/activity';
import { AttendanceService } from 'src/app/shared/services/attendance.service';
import { pipe } from 'rxjs';
import { finalize } from 'rxjs/operators';


@Component({
  selector: 'app-activity-detailed-header',
  templateUrl: './activity-detailed-header.component.html',
  styleUrls: ['./activity-detailed-header.component.scss']
})
export class ActivityDetailedHeaderComponent implements OnInit {
  @Input() activity: IActivity;
  saving = false;

  constructor(public attendanceService: AttendanceService) { }

  ngOnInit() {
  }

  onJoinClick(e: Event) {
    this.saving = true;
    this.attendanceService.attendActivity(this.activity.id)
      .pipe(
        finalize(() => this.saving = false)
      )
      .subscribe();
  }

  onCancelClick(e: Event) {
    this.saving = true;
    this.attendanceService.cancelAttendance(this.activity.id)
      .pipe(
        finalize(() => this.saving = false)
      )
      .subscribe();

  }

  findHost() {
    return this.activity.attendees.find(a => a.isHost);
  }

}
