export class AlbumResponse {
  id: number;
  userId: number;
  title: string;
}

export class AlbumListRequest {
  page: number;
  size: number;
}

export class CreateAlbumRequest {
  title: string;
}

export class UpdateAlbumRequest {
  title: string;
}
