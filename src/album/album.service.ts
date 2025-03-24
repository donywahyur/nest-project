import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpException, Inject, Injectable } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AXIOS_INSTANCE_TOKEN } from 'src/common/axios.provider';
import { PrismaService } from 'src/common/prisma.service';
import { ValidationService } from 'src/common/validation.service';
import {
  AlbumListRequest,
  AlbumResponse,
  CreateAlbumRequest,
  UpdateAlbumRequest,
} from 'src/models/album.model';
import { ApiPagableResponse } from 'src/models/api.model';
import { Logger } from 'winston';
import { AlbumValidation } from './album.validation';

@Injectable()
export class AlbumService {
  constructor(
    private validationService: ValidationService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    @Inject(AXIOS_INSTANCE_TOKEN) private axios: AxiosInstance,
    private prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async list(
    userId: number,
    request: AlbumListRequest,
  ): Promise<ApiPagableResponse<AlbumResponse>> {
    this.logger.info(
      `AlbumService.list(${userId},${JSON.stringify(request)} )`,
    );
    const listRequest = this.validationService.validate(
      AlbumValidation.LIST,
      request,
    );

    const skip = (listRequest.page - 1) * listRequest.size;

    const albumAll = await this.prismaService.album.count({
      where: {
        userId: userId,
      },
    });

    const albumFiltered = await this.prismaService.album.findMany({
      where: {
        userId: userId,
      },
      skip: skip,
      take: listRequest.size,
    });

    return {
      paging: {
        size: listRequest.size,
        current_page: listRequest.page,
        total_record: albumAll,
      },
      data: albumFiltered,
    };
  }

  async fetch(userId: number): Promise<string> {
    const key = `album_${userId}`;

    let cachedAlbum = (await this.cacheManager.get(
      key,
    )) as Array<AlbumResponse>;

    if (!cachedAlbum) {
      const response = await this.axios.get(`users/${userId}/albums?_limit=20`);

      if (!response.data) {
        return 'No new data to fetch';
      }

      const responseApi: Array<AlbumResponse> =
        response.data as Array<AlbumResponse>;
      await this.cacheManager.set(key, responseApi);

      cachedAlbum = responseApi as Array<AlbumResponse>;
    }

    const existingAlbum = await this.prismaService.album.findMany({
      where: {
        userId: userId,
      },
    });

    const existingTitle = new Set(
      existingAlbum.map((t) => t.title.toLowerCase()),
    );

    const newAlbum = cachedAlbum
      .map(({ id, ...rest }) => rest)
      .filter((t) => !existingTitle.has(t.title.toLowerCase()));

    this.logger.info(
      `AlbumService.fetch(newAlbum ${JSON.stringify(newAlbum)})`,
    );

    await this.prismaService.album.createMany({
      data: newAlbum,
    });
    return newAlbum.length > 0
      ? `Success fetch ${newAlbum.length} data`
      : `No new data to fetch`;
  }

  async findAlbum(userId: number, albumId: number): Promise<AlbumResponse> {
    this.logger.info(
      `AlbumService.findAlbum(UserId : ${userId} albumId : ${albumId})`,
    );
    const album = await this.prismaService.album.findFirst({
      where: {
        userId: userId,
        id: albumId,
      },
    });

    if (!album) {
      throw new HttpException('Album not found', 404);
    }

    return album;
  }

  async create(
    userId: number,
    request: CreateAlbumRequest,
  ): Promise<AlbumResponse> {
    this.logger.info(`AlbumService.update(UserId : ${userId})`);
    const createRequest = this.validationService.validate(
      AlbumValidation.CREATE,
      request,
    );

    const record = {
      ...createRequest,
      ...{ userId: userId },
    };

    const response: AlbumResponse = (await this.axios.post(`albums`, record))
      .data;
    delete response.id;

    const album = await this.prismaService.album.create({
      data: response,
    });

    return album;
  }

  async update(
    userId: number,
    albumId: number,
    request: UpdateAlbumRequest,
  ): Promise<AlbumResponse> {
    this.logger.info(
      `AlbumService.update(UserId : ${userId} albumId : ${albumId})`,
    );
    const updateRequest = this.validationService.validate(
      AlbumValidation.UPDATE,
      request,
    );

    const album = await this.findAlbum(userId, albumId);

    //change albumId to max 5000 when access put because id above 100 not exist
    const albumIdApi = albumId > 5000 ? 5000 : albumId;
    const response: AlbumResponse = (
      await this.axios.put(`albums/${albumIdApi}`, updateRequest)
    ).data;

    album.title = response.title;

    const updatedAlbum = await this.prismaService.album.update({
      where: {
        id: albumId,
      },
      data: album,
    });

    return updatedAlbum;
  }

  async remove(userId: number, albumId: number): Promise<string> {
    this.logger.info(
      `AlbumService.remove(UserId : ${userId} albumId : ${albumId})`,
    );
    await this.findAlbum(userId, albumId);

    const photos = await this.prismaService.photo.count({
      where: {
        albumId: albumId,
      },
    });

    if (photos) {
      throw new HttpException(
        'Failed to delete record because it still referenced to other records (photos)',
        400,
      );
    }

    await this.axios.delete(`albums/${albumId}`);

    await this.prismaService.album.delete({
      where: {
        userId: userId,
        id: albumId,
      },
    });

    return `Success delete album`;
  }
}
