import { User } from "src/models/user";

import { UserRepository } from "../repositories/user.repository";
import { JwtAuthService } from "./jwt-auth.service";
import { LoginThrottler } from "./login.throttler";

const fakeUser = {
    email: 'bartosz@app.com',
    password: '$2y$10$k.58cTqd/rRbAOc8zc3nCupCC6QkfamoSoO2Hxq6HVs0iXe7uvS3e', // '123'
    confirmed: true,
    tfa: true,
    tfaSecret: 'abc'
} as User;

const userRepoStub = (user = fakeUser) => {
    return {
        // getUserByEmail: jest.fn(() => Promise.resolve(user))
        getUserByEmail: (email) => {
            console.log('stub have been called');
            return Promise.resolve(user);
        }
    } as Pick<UserRepository, 'getUserByEmail'> as UserRepository
}

const loginThrottlerStub = (blocked: boolean) => {
    return {
        isLoginBlocked: jest.fn(() => Promise.resolve(blocked)),
        registerLoginFailure: jest.fn()
    } as Pick<LoginThrottler, 'isLoginBlocked'> as LoginThrottler
}


describe('JwtAuthService', () => {
    describe('login method', () => {

        it('logins successfully and returns a jwt token', (done) => {
            const jwtAuthService = new JwtAuthService(userRepoStub(), loginThrottlerStub(false));

            jwtAuthService.login({ email: 'toto@app.com', password: '123' })
                .then(res => {
                    expect(res.jwt).toBeDefined();
                    done()
                })
        });

        it('fails to login because user not confirmed', (done) => {
            const userNotConfirmed = {
                email: 'toto@app.com',
                password: '$2y$10$k.58cTqd/rRbAOc8zc3nCupCC6QkfamoSoO2Hxq6HVs0iXe7uvS3e', // '123'
                confirmed: false,
                tfa: true,
                tfaSecret: 'abc'
            } as User;
            const loginThrottler = loginThrottlerStub(true);
            const jwtAuthService = new JwtAuthService(userRepoStub(userNotConfirmed), loginThrottler);

            jwtAuthService.login({ email: 'toto@app.com', password: '123' })
                .catch(err => {
                    expect(err).toEqual('Please confirm your user profile');
                    done();
                })
        })

        it('fails to login because of bad password', (done) => {
            const loginThrottler = loginThrottlerStub(true);
            const jwtAuthService = new JwtAuthService(userRepoStub(), loginThrottler);

            jwtAuthService.login({ email: 'toto@app.com', password: '1234' })
                .catch(err => {
                    expect(loginThrottler.registerLoginFailure).toHaveBeenCalled;
                    done();
                })
        })
    })

    describe('authenticate method', () => {
        it('returns a request handler', () => {
            const jwtAuthService = new JwtAuthService(userRepoStub(), loginThrottlerStub(true));
            const result = jwtAuthService.authenticate();
            expect(typeof result).toBe('function');
        });
    });

});