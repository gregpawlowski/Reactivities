import { ComponentModalConfig, ModalSize } from 'ng2-semantic-ui';
import { LoginFormComponent } from '../login-form/login-form.component';

export class LoginModal extends ComponentModalConfig<void, void> {
  constructor(size = ModalSize.Tiny) {
      super(LoginFormComponent);

      this.isClosable = true;
      this.transitionDuration = 200;
      this.size = size;
  }
}
