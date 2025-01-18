// import {
//   Body,
//   Controller,
//   Get,
//   Header,
//   InternalServerErrorException,
//   Logger,
//   NotFoundException,
//   Param,
//   Post,
//   Res,
//   UploadedFile,
//   UseInterceptors,
// } from "@nestjs/common";
// import { FileInterceptor } from "@nestjs/platform-express";
// import { Response } from "express";
// import { StorageNamespace, StorageService } from "src/storage/storage.service";
// import { Readable } from "stream";
// import { customAlphabet } from "nanoid";
// import { createCanvas } from "canvas";
// import { mkdir, writeFile } from "fs/promises";
// import { join } from "path";

// @Controller("scenes")
// export class ScenesController {
//   private readonly logger = new Logger(ScenesController.name);
//   namespace = StorageNamespace.SCENES;

//   constructor(private storageService: StorageService) {}

//   /**
//    * Retrieve a saved scene by ID
//    */
//   @Get(":id")
//   @Header("content-type", "application/octet-stream")
//   async findOne(@Param("id") id: string, @Res() res: Response): Promise<void> {
//     // loads the scene from storage or disk
//     const data = await this.storageService.get(id, this.namespace);
//     this.logger.debug(`Get scene ${id}`);

//     if (!data) {
//       throw new NotFoundException(`Scene ${id} not found`);
//     }

//     // pipe the data to the response as a stream
//     const stream = new Readable();
//     stream.push(data);
//     stream.push(null);
//     stream.pipe(res);
//   }

//   /**
//    * EXAMPLE: Simple text/binary route that doesn't handle an image
//    */
//   @Post()
//   async create(@Body() payload: Buffer) {
//     const nanoid = customAlphabet("0123456789", 16);
//     const id = nanoid();

//     // Check for collision
//     if (await this.storageService.get(id, this.namespace)) {
//       throw new InternalServerErrorException("Collision detected");
//     }

//     // store the scene bytes
//     await this.storageService.set(id, payload, this.namespace);
//     this.logger.debug(`Created scene ${id}`);

//     return { id };
//   }

//   /**
//    * Save an Excalidraw scene & optional uploaded image via multipart/form-data
//    *
//    * The client should POST FormData with:
//    * - field "image": the raw PNG/JPEG file
//    * - field "elements": JSON.stringify(elements)
//    * - field "appState": JSON.stringify(appState)
//    * - field "files": JSON.stringify(files) (if any)
//    */
//   @Post("save")
//   @UseInterceptors(FileInterceptor("image"))
//   async saveScene(
//     @UploadedFile() imageFile: Express.Multer.File,
//     @Body("elements") elementsString: string,
//     @Body("appState") appStateString: string,
//     @Body("files") filesString: string
//   ) {
//     // Excalidraw scenes require numeric IDs
//     const nanoid = customAlphabet("0123456789", 16);
//     const id = nanoid();

//     try {
//       // 1. Make sure your export dir exists
//       const exportDir = join(__dirname, "..", "exports");
//       await mkdir(exportDir, { recursive: true });

//       // 2. Parse the JSON fields from the form
//       if (!elementsString || !appStateString) {
//         throw new InternalServerErrorException(
//           "Invalid payload: elements and appState are required"
//         );
//       }
//       let elements;
//       let appState;
//       let binaryFiles;
//       try {
//         elements = JSON.parse(elementsString);
//         appState = JSON.parse(appStateString);
//         binaryFiles = filesString ? JSON.parse(filesString) : {};
//       } catch (error) {
//         this.logger.error(`Failed to parse JSON fields: ${error.message}`);
//         throw new InternalServerErrorException("Bad JSON data in form fields");
//       }

//       // 3. Write the JSON scene to disk
//       const serializedScene = JSON.stringify(
//         { elements, appState, files: binaryFiles },
//         null,
//         2
//       );
//       const jsonFilePath = join(exportDir, `scene-${id}.json`);
//       await writeFile(jsonFilePath, serializedScene);
//       this.logger.debug(`Scene saved successfully as JSON at ${jsonFilePath}`);

//       // 4. If the user uploaded an actual image, save it
//       let uploadedFilePath: string | null = null;
//       if (imageFile) {
//         uploadedFilePath = join(exportDir, `scene-upload-${id}.png`);
//         await writeFile(uploadedFilePath, imageFile.buffer);
//         this.logger.debug(
//           `User-uploaded image saved successfully at ${uploadedFilePath}`
//         );
//       }

//       // 5. OPTIONAL: Generate a server-side rendering (preview)
//       //    from the JSON data using node-canvas, if you want.
//       //    This example just draws text if the 'element' has a 'text' prop:
//       const canvas = createCanvas(800, 600);
//       const ctx = canvas.getContext("2d");
//       ctx.fillStyle = appState.viewBackgroundColor || "#ffffff";
//       ctx.fillRect(0, 0, canvas.width, canvas.height);

//       // basic text rendering example
//       elements.forEach((element: any) => {
//         ctx.fillStyle = element.fill || "#000000";
//         if (element.text) {
//           ctx.fillText(element.text, element.x || 0, element.y || 0);
//         }
//       });

//       const previewFilePath = join(exportDir, `scene-preview-${id}.png`);
//       const buffer = canvas.toBuffer("image/png");
//       await writeFile(previewFilePath, buffer);
//       this.logger.debug(
//         `Server-generated preview image saved at ${previewFilePath}`
//       );

//       // 6. Return success
//       return {
//         id,
//         message: "Scene and image saved successfully",
//         filePaths: {
//           json: jsonFilePath,
//           // user’s uploaded file (if any)
//           uploadedImage: uploadedFilePath,
//           // server-generated preview
//           serverRenderedPreview: previewFilePath,
//         },
//       };
//     } catch (error) {
//       this.logger.error(`Error saving scene: ${error.message}`);
//       throw new InternalServerErrorException("Failed to save scene");
//     }
//   }
// }

import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { customAlphabet } from "nanoid";
import { createCanvas } from "canvas";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

@Controller("scenes")
export class ScenesController {
  private readonly logger = new Logger(ScenesController.name);

  @Post("save")
  @UseInterceptors(FileInterceptor("image"))
  async saveScene(
    @UploadedFile() imageFile: Express.Multer.File,
    @Body("elements") elementsString: string,
    @Body("appState") appStateString: string,
    @Body("files") filesString: string,
  ) {
    // Generate numeric ID for the scene
    const nanoid = customAlphabet("0123456789", 16);
    const id = nanoid();

    try {
      // 1. Ensure output directory
      const exportDir = join(__dirname, "..", "exports");
      await mkdir(exportDir, { recursive: true });

      // 2. Parse the JSON from the form fields
      if (!elementsString || !appStateString) {
        throw new InternalServerErrorException(
          "Invalid payload: elements and appState are required",
        );
      }
      const elements = JSON.parse(elementsString);
      const appState = JSON.parse(appStateString);
      const files = filesString ? JSON.parse(filesString) : {};

      // 3. Write the JSON scene to disk
      const sceneData = JSON.stringify({ elements, appState, files }, null, 2);
      const jsonFilePath = join(exportDir, `scene-${id}.json`);
      await writeFile(jsonFilePath, sceneData);
      this.logger.log(`Scene JSON saved at ${jsonFilePath}`);

      // 4. Save the raw uploaded PNG (if provided)
      let uploadedFilePath: string | null = null;
      if (imageFile) {
        // e.g. "scene-<id>.png"
        uploadedFilePath = join(exportDir, `scene-${id}.png`);
        await writeFile(uploadedFilePath, imageFile.buffer);
        this.logger.log(`User-uploaded PNG saved at ${uploadedFilePath}`);
      }

      // 5. (Optional) Server-side rendering with node-canvas
      //    e.g. a quick text-based rendering:
      const canvas = createCanvas(800, 600);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = appState.viewBackgroundColor || "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Example: draw text elements in the correct position
      for (const element of elements) {
        if (element.text) {
          ctx.fillStyle = element.fill || "#000";
          ctx.fillText(element.text, element.x || 0, element.y || 0);
        }
      }

      const previewFilePath = join(exportDir, `scene-preview-${id}.png`);
      const previewBuffer = canvas.toBuffer("image/png");
      await writeFile(previewFilePath, previewBuffer);
      this.logger.log(`Server-rendered preview at ${previewFilePath}`);

      // Return success
      return {
        id,
        message: "Scene and image saved successfully",
        filePaths: {
          json: jsonFilePath,
          uploadedImage: uploadedFilePath,
          serverRenderedPreview: previewFilePath,
        },
      };
    } catch (error) {
      this.logger.error(`Error saving scene: ${error.message}`);
      throw new InternalServerErrorException("Failed to save scene");
    }
  }
}
