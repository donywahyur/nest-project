import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TodoModule } from './todo/todo.module';
import { CacheModule } from '@nestjs/cache-manager';
import { AlbumModule } from './album/album.module';
import { PhotoModule } from './photo/photo.module';
import KeyvRedis from '@keyv/redis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        return {
          stores: [
            new KeyvRedis({
              url: 'redis://redis:6379',
              password: 'redis_1234',
              socket: {
                host: 'localhost',
                port: 6379,
                reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
                keepAlive: 30000,
              },
            }),
          ],
        };
      },
    }),
    CommonModule,
    UserModule,
    AuthModule,
    TodoModule,
    AlbumModule,
    PhotoModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
