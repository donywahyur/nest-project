import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiPagableResponse, ApiResponse } from 'src/models/api.model';
import {
  CreatePhotoRequest,
  PhotoListRequest,
  PhotoResponse,
  UpdatePhotoRequest,
} from 'src/models/photo.model';
import { PhotoService } from './photo.service';

@UseGuards(JwtAuthGuard)
@Controller('api/albums')
export class PhotoController {
  constructor(private photoService: PhotoService) {}

  @Get('/:albumId/photos')
  async list(
    @Req() req,
    @Param('albumId') albumId: string,
    @Query() query,
  ): Promise<ApiPagableResponse<PhotoResponse>> {
    const request: PhotoListRequest = {
      page: Number(query.page),
      size: Number(query.size),
    };
    const response = await this.photoService.list(
      req.user.id,
      Number(albumId),
      request,
    );

    return response;
  }

  @Get('/:albumId/photos/fetch')
  async fetch(
    @Param('albumId') albumId: string,
    @Req() req,
  ): Promise<ApiResponse> {
    const response = await this.photoService.fetch(
      req.user.id,
      Number(albumId),
    );
    return {
      success: true,
      message: response,
    };
  }

  @Post('/:albumId/photos')
  async create(
    @Req() req,
    @Param('albumId') albumId: string,
    @Body() request: CreatePhotoRequest,
  ): Promise<ApiResponse<PhotoResponse>> {
    const response = await this.photoService.create(
      req.user.id,
      Number(albumId),
      request,
    );

    return {
      success: true,
      data: response,
    };
  }

  @Patch('/:albumId/photos/:photoId')
  async update(
    @Req() req,
    @Param('albumId') albumId: string,
    @Param('photoId') photoId: string,
    @Body() request: UpdatePhotoRequest,
  ): Promise<ApiResponse<PhotoResponse>> {
    const response = await this.photoService.update(
      req.user.id,
      Number(albumId),
      Number(photoId),
      request,
    );

    return {
      success: true,
      data: response,
    };
  }

  @Delete('/:albumId/photos/:photoId')
  async remove(
    @Req() req,
    @Param('albumId') albumId: string,
    @Param('photoId') photoId: string,
  ): Promise<ApiResponse> {
    const response = await this.photoService.remove(
      req.user.id,
      Number(albumId),
      Number(photoId),
    );
    return {
      success: true,
      message: response,
    };
  }
}
