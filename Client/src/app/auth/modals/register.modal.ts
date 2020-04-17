import { ComponentModalConfig, ModalSize } from 'ng2-semantic-ui';
import { RegisterFormComponent } from '../register-form/register-form.component';

export class RegisterModal extends ComponentModalConfig<void, void> {
  constructor(size = ModalSize.Tiny) {
      super(RegisterFormComponent);

      this.isClosable = true;
      this.transitionDuration = 200;
      this.size = size;
  }
}
