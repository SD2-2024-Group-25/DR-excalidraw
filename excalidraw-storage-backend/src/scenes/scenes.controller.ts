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
    @Body("username") username: string,
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

      // 3. Ensure username is provided
      if (!username) {
        this.logger.error("No username provided");
        throw new InternalServerErrorException("Username is required");
      }

      // 4. Generate a timestamped filename with username
      const now = new Date();
      const dateStr = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-");
      const timeStr = [
        String(now.getHours()).padStart(2, "0"),
        String(now.getMinutes()).padStart(2, "0"),
        String(now.getSeconds()).padStart(2, "0"),
      ].join("-");
      const sanitizedUsername = username.replace(/[^a-zA-Z0-9_-]/g, "_"); // Sanitize username to avoid invalid characters
      const fileName = `scene-${id}-${sanitizedUsername}-${dateStr}_${timeStr}.png`;

      // 5. Write the uploaded PNG to disk
      const uploadedFilePath = join(exportDir, fileName);
      await writeFile(uploadedFilePath, imageFile.buffer);
      this.logger.log(`User-uploaded PNG saved at ${uploadedFilePath} by ${username}`);

      // 6. Return success response
      return {
        id,
        message: "PNG saved successfully",
        username,
        filePath: uploadedFilePath,
      };
    } catch (error) {
      this.logger.error(`Error saving PNG: ${error.message}`);
      throw new InternalServerErrorException("Failed to save PNG");
    }
  }
}
