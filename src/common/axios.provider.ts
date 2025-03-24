import { HttpException, Provider } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export const AXIOS_INSTANCE_TOKEN = 'AXIOS_INSTANCE';

export const AxiosProvider: Provider = {
  provide: AXIOS_INSTANCE_TOKEN,
  useFactory: (): AxiosInstance => {
    const instance = axios.create({
      baseURL: 'https://jsonplaceholder.typicode.com',
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
    });

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error(`[Error] ${error.message}`);

        throw new HttpException(
          error.message || 'Request api failed',
          error.status || 500,
        );
      },
    );
    return instance;
  },
};
