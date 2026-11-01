import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as express from 'express';

const server = express();

export const createNestApp = async () => {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  const proxyHopsValue = process.env.TRUST_PROXY_HOPS;
  if (proxyHopsValue) {
    const proxyHops = Number(proxyHopsValue);
    if (!Number.isInteger(proxyHops) || proxyHops < 1) {
      throw new Error('TRUST_PROXY_HOPS must be a positive integer');
    }
    server.set('trust proxy', proxyHops);
  }

  app.enableCors({
    origin: ['https://frontend-for-patient-registration-a.vercel.app', 'http://localhost:5173', 'http://localhost:3000','http://localhost:5174','https://healsync360.vercel.app'],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 4000,'0.0.0.0',() => {
    Logger.log(`Server is running on port ${process.env.PORT ?? 4000}`, 'Bootstrap');
  });
  await app.init();
}

createNestApp();

export default server;
