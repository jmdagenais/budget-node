import { InMemoryUserRepository } from '../repositories/in-memory/in-memory-user.repository';
import { UserRepository } from '../repositories/user.repository';
import config from './../../../config';
import { AuthService } from './auth.service';
import { JwtAuthService } from './jwt-auth.service';
import { LoginThrottler } from './login.throttler';
import { OtpService } from './otp.service';
import { SessionAuthService } from './session-auth.service';

const userRepository: UserRepository = new InMemoryUserRepository();
const loginThrottler: LoginThrottler = new LoginThrottler();
const otp = new OtpService();

function getAuthService(): AuthService<any> {
  switch (config.auth) {
    case 'session':
      return new SessionAuthService(otp, userRepository);
    case 'jwt':
      return new JwtAuthService(userRepository, loginThrottler);
    default:
      throw 'AuthService not defined';
  }
}

export default getAuthService();

