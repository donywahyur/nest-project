import { Module } from '@nestjs/common';
import { PhotoController } from './photo.controller';
import { PhotoService } from './photo.service';
import { AlbumModule } from 'src/album/album.module';

@Module({
  imports: [AlbumModule],
  controllers: [PhotoController],
  providers: [PhotoService],
})
export class PhotoModule {}
