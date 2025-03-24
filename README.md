# Development NESTJS Setup with Docker

## Prerequisites

Before running the application, ensure you have the following installed:

- [Docker](https://www.docker.com/get-started)

## Running in Development Mode

### 1️⃣ Clone the Repository

```sh
git clone https://github.com/donywahyur/nest-project.git nest-project
cd nest-project
```

### 2️⃣ Create an `.env` File

Copy the example environment file and set up your own variables:

```
APP_PORT=3001
NODE_ENV=development

MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=nest_project
MYSQL_USER=nest
MYSQL_PASSWORD=nest_1234
MYSQL_TCP_PORT=3307

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_1234

DATABASE_URL="mysql://root:root@mysqldb:${MYSQL_TCP_PORT}/${MYSQL_DATABASE}"

JWT_SECRET="b2a62bcf71878472dbe15ab2379642af187e4fe70273b03dcf6528ed924b025c"
JWT_EXPIRE_IN="1d"

JWT_REFRESH_SECRET="7b76ff02d8db8a81e1e724ada1c075bdf1cc00959896b9221580898027710d39"
JWT_REFRESH_EXPIRE_IN="7d"
```

Modify the `.env` file as needed.

### 3️⃣ Start the Services

Run the following command to start the development environment:

```sh
docker compose -f docker-compose.yml up -d --build
```

This will:

- Start all necessary services (e.g., database, Redis, application server, etc.).
- Mount local files for hot-reloading.

Wait till database ready for connection
Run the following command to check if application is ready

```sh
docker logs nest-project-nestjs-1
```

### 4️⃣ Access the Application

Once running, you can access the services:

- **Backend**: [http://localhost:3001](http://localhost:3001)
- **Database**: [http://localhost:3307](http://localhost:3307)
- **Redis**: [http://localhost:6379](http://localhost:6379)

### 5️⃣ Stopping the Services

To stop all running containers:

```sh
docker compose -f docker-compose.yml down
```

## Troubleshooting

If you encounter permission errors, try:

```sh
sudo chmod -R 777 ./nest-project
```

To remove unused Docker resources:

```sh
docker system prune -a
```

## Additional Commands

### Rebuild Containers (Without Cache)

```sh
docker compose -f docker-compose.yml build --no-cache
```

### View Running Containers

```sh
docker ps
```

### Access Logs

```sh
docker compose -f docker-compose.yml logs -f
```

### Access a Running Container

```sh
docker exec -it nest-project-nestjs-1 bash
```

### For development please run this command to remove error on IDE

```sh
npm install
npx prisma generate
```
