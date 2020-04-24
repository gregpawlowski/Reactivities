import { Component, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile-edit-form',
  templateUrl: './profile-edit-form.component.html',
  styleUrls: ['./profile-edit-form.component.scss']
})
export class ProfileEditFormComponent implements OnInit, OnDestroy {
  profileEditForm: FormGroup;
  profileSubscription: Subscription;
  @Output() profileUpdated = new EventEmitter<void>();
  saving = false;

  constructor(private fb: FormBuilder, private profileService: ProfileService) { }

  ngOnInit() {
    this.profileEditForm = this.fb.group({
      displayName: ['', Validators.required ],
      bio: ['']
    });

    this.profileSubscription = this.profileService.profile$
      .subscribe(profile => {
          this.profileEditForm.patchValue(profile);
      });
  }

  ngOnDestroy() {
    this.profileSubscription.unsubscribe();
  }

  get displayName() { return this.profileEditForm.get('displayName'); }
  get bio() { return this.profileEditForm.get('bio'); }

  handleSubmit() {
    this.saving = true;

    this.profileService.updateProfile(this.profileEditForm.value)
      .subscribe(() => {
        this.profileUpdated.emit();
        this.saving = false;
      });
  }

}
