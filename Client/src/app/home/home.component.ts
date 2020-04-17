import { Component, OnInit, ViewChild } from '@angular/core';
import { UserService } from '../shared/services/user.service';
import { ModalTemplate, SuiModalService, TemplateModalConfig, ModalSize } from 'ng2-semantic-ui';
import { LoginModal } from '../auth/modals/login.modal';
import { RegisterModal } from '../auth/modals/register.modal';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  user$ = this.userService.user$;

  constructor(private userService: UserService, private modalService: SuiModalService) { }

  ngOnInit() {
  }

  onLoginClick() {
    this.modalService
      .open(new LoginModal(ModalSize.Tiny))
      .onApprove(() => {})
      .onDeny(() => {});
  }

  onRegisterClick() {
    this.modalService
      .open(new RegisterModal())
      .onApprove(() => {})
      .onDeny(() => {});
  }

}
