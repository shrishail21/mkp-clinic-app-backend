import { CanActivate, ExecutionContext, Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/auth/decorators/Role.decorator';
import { Role } from 'src/schema/user.schema';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    this.logger.log(`Required roles: ${JSON.stringify(requiredRoles)}`);
    this.logger.log(`User object: ${JSON.stringify(user)}`);

    // If user is not authenticated, throw 403
    if (!user || !user.role) {
      this.logger.warn('Access denied: User not authenticated or role missing');
      throw new ForbiddenException('You are not a valid user to access this resource');
    }

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some((role) => user.role === role);
    
    if (!hasRole) {
      this.logger.warn(`Access denied: User role "${user.role}" not in required roles ${JSON.stringify(requiredRoles)}`);
      throw new ForbiddenException('You are not a valid user to access this resource');
    }

    return true;
  }
}
