import { Component, OnInit, ViewChild } from '@angular/core';
import { ENTER, COMMA, SPACE } from '@angular/cdk/keycodes';
import { FormGroup, FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { AuthService } from 'src/app/core/services/auth.service';
import { selectLoggedInUser } from 'src/app/core/store/selectors/user.selector';
import { UpdateUser } from 'src/app/core/store/actions/user.actions';
import { MatChipInputEvent } from '@angular/material';
import { AppState } from 'src/app/core/store/state/app.state';
import { User } from 'src/app/shared/models/user.model';
import { Storage } from 'aws-amplify';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-edit-user-profile',
  templateUrl: './edit-user-profile.component.html',
  styleUrls: ['./edit-user-profile.component.scss']
})
export class EditUserProfileComponent implements OnInit {

  readonly separatorKeysCodes: number[] = [ENTER, COMMA, SPACE];
  @ViewChild('profilePic', { static: false }) profilePic;
  userProfileForm: FormGroup;
  loggedInUser: User;
  user$: Observable<User>;

  // Profile Picture
  // image: Base64;
  // s3BucketUrl = environment.s3BucketURL;
  currentAvatarUrl: string;

  anonymousAvatar = require('src/assets/images/anonymous-avatar.jpg');
  sexualabuseBucketURL = environment.sexualabuseFilesBucket;

  get avatar() { return this.userProfileForm.get('avatar'); }

  constructor(
    private store: Store<AppState>,
    public authService: AuthService,
  ) {

    this.user$ = this.store.select(selectLoggedInUser);

    this.store.select(selectLoggedInUser).subscribe((u: User) => {
      console.log(u);
      this.loggedInUser = u;
      if (u) {
        // this.userProfileForm.setValue(u);
        this.userProfileForm = new FormGroup({
          name: new FormControl({ value: this.loggedInUser ? this.loggedInUser.name : '', disabled: true }),
          email: new FormControl({ value: this.loggedInUser ? this.loggedInUser.email : '', disabled: true }),
          linkedin_url: new FormControl(this.loggedInUser ? this.loggedInUser.linkedin_url : ''),
          github_url: new FormControl(this.loggedInUser ? this.loggedInUser.github_url : ''),
          stackoverflow_url: new FormControl(this.loggedInUser ? this.loggedInUser.stackoverflow_url : ''),
          location: new FormControl(this.loggedInUser ? this.loggedInUser.location : ''),
          programming_languages: new FormControl(this.loggedInUser && this.loggedInUser.programming_languages ? this.loggedInUser.programming_languages : []),
          currentJobDetails: new FormGroup({
            jobProfile: new FormControl(this.loggedInUser && this.loggedInUser.currentJobDetails ?
              this.loggedInUser.currentJobDetails.jobProfile : ''),
            companyName: new FormControl(this.loggedInUser && this.loggedInUser.currentJobDetails ?
              this.loggedInUser.currentJobDetails.companyName : ''),
            companyLocation: new FormControl(this.loggedInUser && this.loggedInUser.currentJobDetails ?
              this.loggedInUser.currentJobDetails.companyLocation : '')
          }),
          _id: new FormControl(this.loggedInUser ? this.loggedInUser._id : ''),
          avatar: new FormControl(this.loggedInUser && this.loggedInUser.avatar ? this.loggedInUser.avatar : '')
        });

        // if (this.avatar.value) {
        //   this.currentAvatarUrl = this.s3BucketUrl + this.avatar.value;
        // }
      }
    });
  }

  ngOnInit() {

  }

  updateUser(): void {
    console.log(this.userProfileForm.value);
    this.store.dispatch(UpdateUser({ payload: this.userProfileForm.value }));
  }

  addProgrammingLanguage(event: MatChipInputEvent) {
    const input = event.input;
    const value = event.value;
    if ((value.trim() !== '')) {
      // this.loggedInUser.programming_languages.push(value);

      this.userProfileForm.get('programming_languages').value.push(value);
      this.userProfileForm.controls.programming_languages.markAsDirty();
      input.value = '';
    }
  }

  onRemoveProgrammingLanguage(email: any) {
    const controller = this.userProfileForm.controls.programming_languages;
    const index = this.loggedInUser.programming_languages.indexOf(email, 0);
    if (index > -1) {
      this.userProfileForm.get('programming_languages').value.splice(index, 1);
    }
    controller.markAsDirty();
  }

  addProfilePic() {
    this.profilePic.nativeElement.click();
  }

  onFilesAdded() {
    // const files: { [key: string]: File } = this.file.nativeElement.files;
    const pic: File = this.profilePic.nativeElement.files[0];
    console.log(pic);

    const fileNameSplitArray = pic.name.split('.');
    const fileExt = fileNameSplitArray.pop();
    const fileName = fileNameSplitArray[0] + '-' + new Date().toISOString() + '.' + fileExt;

    Storage.vault.put(fileName, pic, {

      // bucket: 'sexualabuse-files',
      path: 'avatar',
      level: 'public',

      contentType: pic.type,

    }).then((uploaded: any) => {
      console.log(uploaded);
      console.log('uploaded', uploaded);
      this.avatar.setValue(uploaded.key);
    });


    this.profilePic.nativeElement.value = null;

    // console.log(this.files);
  }


}
