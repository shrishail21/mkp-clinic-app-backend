import { Module } from '@nestjs/common';
import { PatientController } from './modules/patient/patient.controller';
import { PatientService } from './modules/patient/patient.service';
import { PatientSchema } from './schema/patient.schema';
import { AppController } from './app.controller';
import { PrescriptionsController } from './modules/prescriptions/prescriptions.controller';
import { PrescriptionsService } from './modules/prescriptions/prescriptions.service';
import { PrescriptionSchema } from './schema/prescriptions.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UserController } from './modules/user/user.controller';
import { UserService } from './modules/user/user.service';
import { UserSchema } from './schema/user.schema';
import { AuthModule } from './auth/auth.module';
import { DrugsSchema } from './schema/drugs.schema';
import { DrugsController } from './modules/drugs/drugs.controller';
import { DrugsService } from './modules/drugs/drugs.service';
import { ClinicSchema } from './schema/clinic.schema';
import { ClinicController } from './modules/clinic/clinic.controller';
import { ClinicService } from './modules/clinic/clinic.service';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { ServicesBillingModule } from './modules/services-billing/services-billing.module';
import { LabTestBillingModule } from './modules/lab-test-billing/lab-test-billing.module';
import { MedicinesBillingModule } from './modules/medicines-billing/medicines-billing.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { LabTestBillingSchema } from './schema/lab-test-billing.schema';
import { MedicinesBillingSchema } from './schema/medicines-billing.schema';
import { InvoiceSchema } from './schema/invoice.schema';
import { getConnectionToken } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { Connection } from 'mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { MongoThrottlerStorage } from './shared/services/mongo-throttler.storage';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,  // This makes the config available globally in your app
      envFilePath: '.env', // Make sure this points to the correct location of your .env file
    }),
    MongooseModule.forRoot(
      process.env.DATABASE_URL ?? (() => { throw new Error('DATABASE_URL environment variable is not set'); })()
    ),
    ThrottlerModule.forRootAsync({
      inject: [getConnectionToken()],
      useFactory: async (connection: Connection) => {
        const storage = new MongoThrottlerStorage(connection);
        await storage.initialize();

        return {
          throttlers: [
            { name: 'default', limit: 100, ttl: 60_000 },
            {
              name: 'login-account',
              limit: 20,
              ttl: 60_000,
              skipIf: (context) =>
                context.getClass().name !== 'AuthController' ||
                context.getHandler().name !== 'login',
              getTracker: (request: { body?: { email?: unknown }; ip?: string }) => {
                const email = request.body?.email;
                return typeof email === 'string' && email.trim()
                  ? `email:${email.trim().toLowerCase()}`
                  : `ip:${request.ip ?? 'unknown'}`;
              },
            },
          ],
          getTracker: (request: {
            ip?: string;
            socket?: { remoteAddress?: string };
          }) => {
            const tracker = request.ip ?? request.socket?.remoteAddress;
            if (!tracker) {
              throw new Error('Unable to determine a rate-limit tracker');
            }
            return String(tracker);
          },
          storage,
        };
      },
    }),
    MongooseModule.forFeature([
      { name: 'Patient', schema: PatientSchema },
      { name: 'Prescription', schema: PrescriptionSchema },
      { name: 'User', schema: UserSchema } ,
      { name: 'Drugs', schema: DrugsSchema },
      { name: 'Clinic', schema: ClinicSchema },
      { name: 'LabTestBilling', schema: LabTestBillingSchema },
      { name: 'MedicinesBilling', schema: MedicinesBillingSchema },
      { name: 'Invoice', schema: InvoiceSchema },
    ]),
    AppointmentModule,
    AuthModule,
    ServicesBillingModule,
    LabTestBillingModule,
    MedicinesBillingModule,
    InvoiceModule
  ],
  controllers: [AppController, PatientController, PrescriptionsController, UserController, DrugsController, ClinicController,],
  providers: [
    PatientService,
    PrescriptionsService,
    UserService,
    DrugsService,
    ClinicService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
