export class PhotoResponse {
  id: number;
  albumId: number;
  title: string;
  url: string;
  thumbnailUrl: string;
}

export class PhotoListRequest {
  page: number;
  size: number;
}

export class CreatePhotoRequest {
  title: string;
  url: string;
  thumbnailUrl: string;
}

export class UpdatePhotoRequest {
  title?: string;
  url?: string;
  thumbnailUrl?: string;
}
