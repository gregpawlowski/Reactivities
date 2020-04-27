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
import { ProfileAboutComponent } from './profile-about/profile-about.component';
import { ProfileEditFormComponent } from './profile-edit-form/profile-edit-form.component';
import { ProfileFollowingsComponent } from './profile-followings/profile-followings.component';
import { ProfileCardComponent } from './profile-card/profile-card.component';

@NgModule({
  declarations: [
    ProfilePageComponent,
    ProfileHeaderComponent,
    ProfileContentComponent,
    ProfilePhotosComponent,
    PhotoUploadWidgetComponent,
    ProfileAboutComponent,
    ProfileEditFormComponent,
    ProfileFollowingsComponent,
    ProfileCardComponent
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
