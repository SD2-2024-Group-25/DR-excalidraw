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
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

@Controller("scenes")
export class ScenesController {
  private readonly logger = new Logger(ScenesController.name);

  @Post("save")
  @UseInterceptors(FileInterceptor("image"))
  async savePng(
    @UploadedFile() imageFile: Express.Multer.File,
  ) {
    // Generate numeric ID for the scene
    const nanoid = customAlphabet("0123456789", 16);
    const id = nanoid();

    try {
      // 1. Ensure output directory
      const exportDir = join(__dirname, "..", "exports");
      await mkdir(exportDir, { recursive: true });

      // 2. If no file was uploaded, return an error or handle it gracefully
      if (!imageFile) {
        this.logger.error("No file uploaded");
        throw new InternalServerErrorException("No PNG file provided");
      }

      // 3. Write the uploaded PNG to disk
      const uploadedFilePath = join(exportDir, `scene-${id}.png`);
      await writeFile(uploadedFilePath, imageFile.buffer);
      this.logger.log(`User-uploaded PNG saved at ${uploadedFilePath}`);

      // 4. Return success response
      return {
        id,
        message: "PNG saved successfully",
        filePath: uploadedFilePath,
      };
    } catch (error) {
      this.logger.error(`Error saving PNG: ${error.message}`);
      throw new InternalServerErrorException("Failed to save PNG");
    }
  }
}
