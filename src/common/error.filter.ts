import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { ApiResponse } from 'src/models/api.model';
import { ZodError } from 'zod';

@Catch(ZodError, HttpException)
export class ErrorFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    if (exception instanceof HttpException) {
      const res: ApiResponse = {
        success: false,
        error_code: Number(exception.getStatus()),
        errors: exception.getResponse(),
      };
      response.status(exception.getStatus()).json(res);
    } else if (exception instanceof ZodError) {
      const res: ApiResponse = {
        success: false,
        error_code: 400,
        errors: exception.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      };
      response.status(400).json(res);
    } else {
      const res: ApiResponse = {
        success: false,
        error_code: 500,
        errors: exception.message,
      };
      response.status(500).json(res);
    }
  }
}
