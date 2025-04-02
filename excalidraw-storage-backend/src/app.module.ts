import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { RawParserMiddleware } from './raw-parser.middleware';
import { ScenesController } from './scenes/scenes.controller';
import { StorageService } from './storage/storage.service';
// import { RoomsController } from './rooms/rooms.controller';
// import { FilesController } from './files/files.controller';

@Module({
  imports: [],
  controllers: [ScenesController], // RoomsController, FilesController],
  providers: [StorageService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RawParserMiddleware)
      // Exclude the route that handles multipart for POST /api/v2/scenes/save
      // Adjust your path if needed (remove `api/v2` if you have a global prefix).
      .exclude({ path: 'api/v2/scenes/save', method: RequestMethod.POST })
      .forRoutes('**');
  }
}

