export class TodoResponse {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

export class TodoListRequest {
  page: number;
  size: number;
}
export class CreateTodoRequest {
  title: string;
  completed: boolean;
}

export class UpdateTodoRequest {
  title: string;
  completed: boolean;
}
