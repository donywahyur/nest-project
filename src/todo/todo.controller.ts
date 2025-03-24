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
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiPagableResponse, ApiResponse } from 'src/models/api.model';
import {
  CreateTodoRequest,
  TodoListRequest,
  TodoResponse,
  UpdateTodoRequest,
} from 'src/models/todo.model';
import { TodoService } from './todo.service';

@UseGuards(JwtAuthGuard)
@Controller('api/todos')
export class TodoController {
  constructor(private todoService: TodoService) {}
  @Get()
  async list(
    @Query() query,
    @Req() req,
  ): Promise<ApiPagableResponse<TodoResponse>> {
    const request: TodoListRequest = {
      page: Number(query.page),
      size: Number(query.size),
    };
    const response = await this.todoService.list(req.user.id, request);
    return response;
  }

  @Get('/fetch')
  async fetch(@Req() req): Promise<ApiResponse> {
    const response = await this.todoService.fetch(req.user.id);
    return {
      success: true,
      message: response,
    };
  }

  @Post()
  async create(
    @Req() req,
    @Body() request: CreateTodoRequest,
  ): Promise<ApiResponse<TodoResponse>> {
    const response = await this.todoService.create(req.user.id, request);

    return {
      success: true,
      data: response,
    };
  }

  @Put('/update/:todoId')
  async update(
    @Req() req,
    @Param('todoId') todoId: string,
    @Body() request: UpdateTodoRequest,
  ): Promise<ApiResponse<TodoResponse>> {
    const response = await this.todoService.update(
      req.user.id,
      Number(todoId),
      request,
    );

    return {
      success: true,
      data: response,
    };
  }

  @Delete('/delete/:todoId')
  async remove(
    @Req() req,
    @Param('todoId') todoId: string,
  ): Promise<ApiResponse> {
    const response = await this.todoService.remove(req.user.id, Number(todoId));
    return {
      success: true,
      message: response,
    };
  }
}
