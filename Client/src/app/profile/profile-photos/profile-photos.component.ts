import { Component, OnInit } from '@angular/core';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { Observable } from 'rxjs';
import { IProfile, IPhoto } from 'src/app/shared/models/profile';
import { finalize } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-profile-photos',
  templateUrl: './profile-photos.component.html',
  styles: []
})
export class ProfilePhotosComponent implements OnInit {
  addPhotoMode = false;
  saving: { id: string, type: string } = undefined;

  constructor(public profileService: ProfileService, private toastr: ToastrService) { }

  ngOnInit() {
  }

  togglePhotoMode() {
    this.addPhotoMode = !this.addPhotoMode;
  }

  setMain(photo: IPhoto) {
    this.saving = { id: photo.id, type: 'main' };
    this.profileService.setMainPhoto(photo)
      .pipe(finalize(() => this.saving = undefined))
      .subscribe(undefined, (err: HttpErrorResponse) => {
        this.toastr.error(err.statusText);
      });
  }

  deletePhoto(photo: IPhoto) {
    this.saving = { id: photo.id, type: 'delete'};
    this.profileService.deletePhoto(photo)
      .pipe(finalize(() => this.saving = undefined))
      .subscribe(undefined, (err: HttpErrorResponse) => {
        const errorArray = Object.values<string>(err.error.errors).flat();
        this.toastr.error(errorArray.join(' '));
      });
  }

}
