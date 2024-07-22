import type {
  CanActivate,
  ExecutionContext,
  OnModuleInit,
} from '@nestjs/common';
import { Injectable, UseGuards } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { getRequestResponseFromContext } from '../../fundamentals';
import { GuardProvider } from '../../fundamentals/guard/provider';
import { CaptchaService } from './service';

@Injectable()
export class CaptchaGuard
  extends GuardProvider
  implements CanActivate, OnModuleInit
{
  private captcha?: CaptchaService;

  constructor(private readonly ref: ModuleRef) {
    super();
  }

  override onModuleInit() {
    super.onModuleInit();
    try {
      this.captcha = this.ref.get(CaptchaService, { strict: false });
    } catch {
      // ignore
    }
  }

  override get name() {
    return 'captcha';
  }

  async canActivate(context: ExecutionContext) {
    const { req } = getRequestResponseFromContext(context);

    const captcha = this.captcha;
    if (captcha) {
      const { token, challenge } = req.query;
      const credential = captcha.assertValidCredential({ token, challenge });
      await captcha.verifyRequest(credential, req);
    }

    return true;
  }
}

/**
 * This guard is used to protect routes/queries/mutations that require a user to be check browser env.
 * It will check if the user has passed the captcha challenge.
 *
 * @example
 *
 * ```typescript
 * \@Captcha()
 * \@Query(() => UserType)
 * protected() {
 *   return true;
 * }
 * ```
 */
export const Captcha = () => {
  return UseGuards(CaptchaGuard);
};
