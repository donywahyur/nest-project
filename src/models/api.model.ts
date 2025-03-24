export class ApiResponse<T = undefined> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
  error_code?: number;
}

type Paging = {
  size: number;
  current_page: number;
  total_record: number;
};

export class ApiPagableResponse<T> {
  data: Array<T>;
  paging: Paging;
}
