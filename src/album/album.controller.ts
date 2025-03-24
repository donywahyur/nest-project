import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AlbumService } from './album.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiPagableResponse, ApiResponse } from 'src/models/api.model';
import {
  AlbumListRequest,
  AlbumResponse,
  CreateAlbumRequest,
  UpdateAlbumRequest,
} from 'src/models/album.model';

@UseGuards(JwtAuthGuard)
@Controller('api/albums')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}
  @Get()
  async list(
    @Query() query,
    @Req() req,
  ): Promise<ApiPagableResponse<AlbumResponse>> {
    const request: AlbumListRequest = {
      page: Number(query.page),
      size: Number(query.size),
    };
    const response = await this.albumService.list(req.user.id, request);
    return response;
  }

  @Get('/fetch')
  async fetch(@Req() req): Promise<ApiResponse> {
    const response = await this.albumService.fetch(req.user.id);
    return {
      success: true,
      message: response,
    };
  }

  @Post()
  async create(
    @Req() req,
    @Body() request: CreateAlbumRequest,
  ): Promise<ApiResponse<AlbumResponse>> {
    const response = await this.albumService.create(req.user.id, request);

    return {
      success: true,
      data: response,
    };
  }

  @Put('/update/:albumId')
  async update(
    @Req() req,
    @Param('albumId') albumId: string,
    @Body() request: UpdateAlbumRequest,
  ): Promise<ApiResponse<AlbumResponse>> {
    const response = await this.albumService.update(
      req.user.id,
      Number(albumId),
      request,
    );

    return {
      success: true,
      data: response,
    };
  }

  @Delete('/delete/:albumId')
  async remove(
    @Req() req,
    @Param('albumId') albumId: string,
  ): Promise<ApiResponse> {
    const response = await this.albumService.remove(
      req.user.id,
      Number(albumId),
    );
    return {
      success: true,
      message: response,
    };
  }
}
