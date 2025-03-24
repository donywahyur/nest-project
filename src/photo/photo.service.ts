import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpException, Inject, Injectable } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AXIOS_INSTANCE_TOKEN } from 'src/common/axios.provider';
import { PrismaService } from 'src/common/prisma.service';
import { ValidationService } from 'src/common/validation.service';
import {
  PhotoListRequest,
  PhotoResponse,
  CreatePhotoRequest,
  UpdatePhotoRequest,
} from 'src/models/photo.model';
import { ApiPagableResponse } from 'src/models/api.model';
import { Logger } from 'winston';
import { PhotoValidation } from './photo.validation';
import { AlbumService } from 'src/album/album.service';

@Injectable()
export class PhotoService {
  constructor(
    private validationService: ValidationService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    @Inject(AXIOS_INSTANCE_TOKEN) private axios: AxiosInstance,
    private prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private albumService: AlbumService,
  ) {}

  async list(
    userId: number,
    albumId: number,
    request: PhotoListRequest,
  ): Promise<ApiPagableResponse<PhotoResponse>> {
    this.logger.info(
      `PhotoService.list(${userId},${albumId},${JSON.stringify(request)} )`,
    );
    await this.albumService.findAlbum(userId, albumId);

    const listRequest = this.validationService.validate(
      PhotoValidation.LIST,
      request,
    );

    const skip = (listRequest.page - 1) * listRequest.size;

    const photoAll = await this.prismaService.photo.count({
      where: {
        albumId: albumId,
      },
    });

    const photoFiltered = await this.prismaService.photo.findMany({
      where: {
        albumId: albumId,
      },
      skip: skip,
      take: listRequest.size,
    });

    return {
      paging: {
        size: listRequest.size,
        current_page: listRequest.page,
        total_record: photoAll,
      },
      data: photoFiltered,
    };
  }

  async fetch(userId: number, albumId: number): Promise<string> {
    await this.albumService.findAlbum(userId, albumId);

    const key = `photo_${albumId}`;

    let cachedPhoto = (await this.cacheManager.get(
      key,
    )) as Array<PhotoResponse>;

    if (!cachedPhoto) {
      const response = await this.axios.get(
        `albums/${albumId}/photos?_limit=20`,
      );

      if (!response.data) {
        return 'No new data to fetch';
      }

      const responseApi: Array<PhotoResponse> =
        response.data as Array<PhotoResponse>;
      await this.cacheManager.set(key, responseApi);

      cachedPhoto = responseApi as Array<PhotoResponse>;
    }

    const existingPhoto = await this.prismaService.photo.findMany({
      where: {
        albumId: albumId,
      },
    });

    const existingTitle = new Set(
      existingPhoto.map((t) => t.title.toLowerCase()),
    );

    const newPhoto = cachedPhoto
      .map(({ id, ...rest }) => rest)
      .filter((t) => !existingTitle.has(t.title.toLowerCase()));

    this.logger.info(
      `PhotoService.fetch(newPhoto ${JSON.stringify(newPhoto)})`,
    );

    await this.prismaService.photo.createMany({
      data: newPhoto,
    });
    return newPhoto.length > 0
      ? `Success fetch ${newPhoto.length} data`
      : `No new data to fetch`;
  }

  async create(
    userId: number,
    albumId: number,
    request: CreatePhotoRequest,
  ): Promise<PhotoResponse> {
    await this.albumService.findAlbum(userId, albumId);

    this.logger.info(`PhotoService.create(UserId : ${userId})`);
    const createRequest = this.validationService.validate(
      PhotoValidation.CREATE,
      request,
    );

    const record = {
      ...createRequest,
      ...{ albumId: albumId },
    };

    const response: PhotoResponse = (await this.axios.post(`albums`, record))
      .data;
    delete response.id;

    const photo = await this.prismaService.photo.create({
      data: response,
    });

    return photo;
  }

  async findPhoto(albumId: number, photoId: number): Promise<PhotoResponse> {
    const photo = await this.prismaService.photo.findFirst({
      where: {
        albumId: albumId,
        id: photoId,
      },
    });

    if (!photo) {
      throw new HttpException('Photo not found', 404);
    }

    return photo;
  }

  async update(
    userId: number,
    albumId: number,
    photoId: number,
    request: UpdatePhotoRequest,
  ): Promise<PhotoResponse> {
    this.logger.info(
      `PhotoService.update(UserId : ${userId} albumId : ${albumId} photoId : ${photoId})`,
    );

    await this.albumService.findAlbum(userId, albumId);

    const updateRequest = this.validationService.validate(
      PhotoValidation.UPDATE,
      request,
    );

    const photo = await this.findPhoto(albumId, photoId);

    //change photoId to max 5000 when access put because id above 100 not exist
    const photoIdApi = photoId > 5000 ? 5000 : photoId;
    const response: PhotoResponse = (
      await this.axios.patch(`photos/${photoIdApi}`, updateRequest)
    ).data;

    if (updateRequest.title) {
      photo.title = response.title;
    }
    if (updateRequest.url) {
      photo.url = response.url;
    }
    if (updateRequest.title) {
      photo.thumbnailUrl = response.thumbnailUrl;
    }

    const updatedPhoto = await this.prismaService.photo.update({
      where: {
        id: photoId,
      },
      data: photo,
    });

    return updatedPhoto;
  }

  async remove(
    userId: number,
    albumId: number,
    photoId: number,
  ): Promise<string> {
    this.logger.info(
      `PhotoService.remove(UserId : ${userId} albumId : ${albumId})`,
    );
    await this.albumService.findAlbum(userId, albumId);

    await this.findPhoto(albumId, photoId);

    await this.axios.delete(`photos/${albumId}`);

    await this.prismaService.photo.delete({
      where: {
        id: photoId,
      },
    });

    return `Success delete photo`;
  }
}
