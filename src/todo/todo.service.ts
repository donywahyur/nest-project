import { HttpException, Inject, Injectable } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AXIOS_INSTANCE_TOKEN } from 'src/common/axios.provider';
import { PrismaService } from 'src/common/prisma.service';
import { ValidationService } from 'src/common/validation.service';
import { ApiPagableResponse } from 'src/models/api.model';
import {
  TodoListRequest,
  TodoResponse,
  UpdateTodoRequest,
} from 'src/models/todo.model';
import { TodoValidation } from './todo.validation';
import { Logger } from 'winston';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class TodoService {
  constructor(
    private validationService: ValidationService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    @Inject(AXIOS_INSTANCE_TOKEN) private axios: AxiosInstance,
    private prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async list(
    userId: number,
    request: TodoListRequest,
  ): Promise<ApiPagableResponse<TodoResponse>> {
    this.logger.info(`TodoService.list(${userId},${JSON.stringify(request)} )`);
    const listRequest = this.validationService.validate(
      TodoValidation.LIST,
      request,
    );

    const skip = (listRequest.page - 1) * listRequest.size;

    const todoAll = await this.prismaService.todo.count({
      where: {
        userId: userId,
      },
    });

    const todoFiltered = await this.prismaService.todo.findMany({
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
        total_record: todoAll,
      },
      data: todoFiltered,
    };
  }

  async fetch(userId: number): Promise<string> {
    const key = `todo_${userId}`;

    let cachedTodo = (await this.cacheManager.get(key)) as Array<TodoResponse>;
    if (!cachedTodo) {
      const response = await this.axios.get(`users/${userId}/todos`);

      if (!response.data) {
        return 'No new data to fetch';
      }

      const responseApi: Array<TodoResponse> =
        response.data as Array<TodoResponse>;
      await this.cacheManager.set(key, responseApi);

      cachedTodo = responseApi as Array<TodoResponse>;
    }

    const existingTodo = await this.prismaService.todo.findMany({
      where: {
        userId: userId,
      },
    });

    const existingTitle = new Set(
      existingTodo.map((t) => t.title.toLowerCase()),
    );

    const newTodo = cachedTodo
      .map(({ id, ...rest }) => rest)
      .filter((t) => !existingTitle.has(t.title.toLowerCase()));

    this.logger.info(`TodoService.fetch(newTodo ${JSON.stringify(newTodo)})`);

    await this.prismaService.todo.createMany({
      data: newTodo,
    });
    return newTodo.length > 0
      ? `Success fetch ${newTodo.length} data`
      : `No new data to fetch`;
  }

  async findTodo(userId: number, todoId: number): Promise<TodoResponse> {
    this.logger.info(
      `TodoService.findTodo(UserId : ${userId} TodoId : ${todoId})`,
    );
    const todo = await this.prismaService.todo.findFirst({
      where: {
        userId: userId,
        id: todoId,
      },
    });

    if (!todo) {
      throw new HttpException('Todo not found', 404);
    }

    return todo;
  }

  async create(
    userId: number,
    request: UpdateTodoRequest,
  ): Promise<TodoResponse> {
    this.logger.info(`TodoService.update(UserId : ${userId})`);
    const createRequest = this.validationService.validate(
      TodoValidation.CREATE,
      request,
    );

    const record = {
      ...createRequest,
      ...{ userId: userId },
    };

    const response: TodoResponse = (await this.axios.post(`todos`, record))
      .data;
    delete response.id;

    const user = await this.prismaService.todo.create({
      data: response,
    });

    return user;
  }

  async update(
    userId: number,
    todoId: number,
    request: UpdateTodoRequest,
  ): Promise<TodoResponse> {
    this.logger.info(
      `TodoService.update(UserId : ${userId} TodoId : ${todoId})`,
    );
    const updateRequest = this.validationService.validate(
      TodoValidation.UPDATE,
      request,
    );

    const todo = await this.findTodo(userId, todoId);

    //change todoId to max 200 when access put because id above 100 not exist
    const todoIdApi = todoId > 200 ? 200 : todoId;
    const response: TodoResponse = (
      await this.axios.put(`todos/${todoIdApi}`, request)
    ).data;

    todo.completed = response.completed;
    todo.title = response.title;

    const updatedUser = await this.prismaService.todo.update({
      where: {
        id: todoId,
      },
      data: todo,
    });

    return updatedUser;
  }

  async remove(userId: number, todoId: number): Promise<string> {
    this.logger.info(
      `TodoService.remove(UserId : ${userId} TodoId : ${todoId})`,
    );
    await this.findTodo(userId, todoId);

    await this.axios.delete(`todos/${todoId}`);

    await this.prismaService.todo.delete({
      where: {
        userId: userId,
        id: todoId,
      },
    });

    return `Success delete todo`;
  }
}
