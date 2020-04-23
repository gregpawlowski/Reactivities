import { Component, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ImageCroppedEvent, base64ToFile } from 'ngx-image-cropper';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { finalize } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-photo-upload-widget',
  templateUrl: './photo-upload-widget.component.html',
  styleUrls: ['./photo-upload-widget.component.scss']
})
export class PhotoUploadWidgetComponent implements OnInit {
  @Output() photoUploaded = new EventEmitter<void>();

  file: File & { preview?: SafeUrl & {changingThisBreaksApplicationSecurity?: string} };
  imageChangeEvent: any;
  croppedFile: string;
  uploadingPhoto = false;
  uploadProgress: number;

  constructor(private sanitizer: DomSanitizer, private profileService: ProfileService, private toastr: ToastrService) { }

  ngOnInit() {
  }

  onFileAdd(event: {addedFiles: File[], rejectedFiles: File[]} ) {
    this.file = event.addedFiles[0];
    /*
    * This is getting commented out because image-cropepr angular accepts a file.
    * No need to convert the file to a Base64 URL using URL.cretaeObjectURL.
    */
    // if (this.file) {
    //   URL.revokeObjectURL(this.file.preview.changingThisBreaksApplicationSecurity);
    // }
    // const file = event.addedFiles[0];
    // this.file = Object.assign(file, { preview: this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(file))});
  }

  // ngOnDestroy() {
  //   if (this.file) {
  //     URL.revokeObjectURL(this.file.preview.changingThisBreaksApplicationSecurity);
  //   }
  // }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedFile = event.base64;
    // this.file = base64ToFile(event.base64);
  }

  uploadPhoto() {
    this.uploadingPhoto = true;
    const blobToUpload = base64ToFile(this.croppedFile);

    this.profileService.uploadPhoto(blobToUpload)
      .pipe(
        finalize(() => this.uploadingPhoto = false)
      )
      .subscribe(() => {
        this.croppedFile = undefined;
        this.photoUploaded.emit();
      }, () => {
        this.toastr.error('Problem uploading photo');
      });
  }

  cancelPhoto() {
    this.croppedFile = undefined;
  }

}
