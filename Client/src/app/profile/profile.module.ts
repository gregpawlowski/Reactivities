import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfileRoutingModule } from './profile-routing.module';
import { ProfilePageComponent } from './profile-page/profile-page.component';
import { ProfileHeaderComponent } from './profile-header/profile-header.component';
import { ProfileContentComponent } from './profile-content/profile-content.component';
import { SharedModule } from '../shared/shared.module';
import { ProfilePhotosComponent } from './profile-photos/profile-photos.component';
import { PhotoUploadWidgetComponent } from './photo-upload-widget/photo-upload-widget.component';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { ImageCropperModule } from 'ngx-image-cropper';

@NgModule({
  declarations: [
    ProfilePageComponent,
    ProfileHeaderComponent,
    ProfileContentComponent,
    ProfilePhotosComponent,
    PhotoUploadWidgetComponent
  ],
  imports: [
    NgxDropzoneModule,
    CommonModule,
    ProfileRoutingModule,
    SharedModule,
    ImageCropperModule
  ]
})
export class ProfileModule { }
