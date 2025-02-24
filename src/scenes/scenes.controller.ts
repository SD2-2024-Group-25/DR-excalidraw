import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  InternalServerErrorException,
  NotFoundException,
  Logger,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { customAlphabet } from 'nanoid';
import { StorageService, StorageNamespace } from '../storage/storage.service';
import * as JSZip from 'jszip';

@Controller('scenes')
export class ScenesController {
  private readonly logger = new Logger(ScenesController.name);

  constructor(private readonly storageService: StorageService) {}

@Post("save")
@UseInterceptors(FileInterceptor("image"))
async savePng(
  @UploadedFile() imageFile: Express.Multer.File,
  @Body("username") username: string, // Extract 'username' from body
  @Body("userID") userID: string // Extract 'userID' from body
) {
  const nanoid = customAlphabet("0123456789", 16)();

  try {
    if (!imageFile) throw new InternalServerErrorException("No PNG file provided");
    if (!username) throw new InternalServerErrorException("Username is required");

    const sanitizedUsername = username.replace(/[^a-zA-Z0-9_-]/g, "_");
    const metadata = {
      id: nanoid,
      username: sanitizedUsername,
      userID: userID || "unknown",
      fileType: imageFile.mimetype,
      createdAt: new Date().toISOString(),
    };

    await Promise.all([
      this.storageService.set(`${nanoid}-data`, imageFile.buffer, StorageNamespace.SCENES),
      this.storageService.set(`${nanoid}-meta`, Buffer.from(JSON.stringify(metadata)), StorageNamespace.SCENES),
    ]);

    this.logger.log(`Saved PNG with ID ${nanoid} for username ${sanitizedUsername}`);

    return {
      id: nanoid,
      message: "PNG saved successfully",
      username: sanitizedUsername,
      userID: userID || "unknown",
    };
  } catch (error) {
    this.logger.error(`Error saving PNG: ${error.message}`);
    throw new InternalServerErrorException("Failed to save PNG");
  }
}

@Get("download")
async downloadAllScenes(@Res() res: Response) {
  this.logger.log("Preparing to download all scenes...");
  try {
    const allKeys = await this.storageService.getKeys(StorageNamespace.SCENES);

    const archive = [];
    for (const key of allKeys) {
      if (key.endsWith("-data")) {
        const id = key.replace("-data", "");

        // Fetch data and metadata
        const [bufferData, metadataBuffer] = await Promise.all([
          this.storageService.get(`${id}-data`, StorageNamespace.SCENES),
          this.storageService.get(`${id}-meta`, StorageNamespace.SCENES),
        ]);

        if (bufferData && metadataBuffer) {
          const metadata = JSON.parse(Buffer.from(metadataBuffer.data).toString());
          archive.push({
            filename: `${metadata.id}_${metadata.username}.png`,
            data: Buffer.from(bufferData.data),
          });
        }
      }
    }

    if (archive.length === 0) {
      this.logger.warn("No valid scenes to include in the ZIP archive.");
      throw new NotFoundException("No scenes found.");
    }

    // Create the ZIP archive
    const JSZip = require("jszip");
    const zip = new JSZip();

    archive.forEach(file => {
      zip.file(file.filename, file.data);
    });

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // Set response headers and send the ZIP file
    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="scenes.zip"',
    });
    res.send(zipBuffer);

    this.logger.log(`Successfully sent ZIP file containing ${archive.length} scenes.`);
  } catch (error) {
    this.logger.error(`Error downloading scenes: ${error.message}`);
    throw new InternalServerErrorException("Failed to download scenes.");
  }
}

@Get(":id")
async getPng(@Param("id") id: string, @Res() res: Response) {
  try {
    // Fetch the image data
    const bufferData = await this.storageService.get(`${id}-data`, StorageNamespace.SCENES);

    if (!bufferData) {
      throw new NotFoundException(`Scene ${id} not found`);
    }

    // Convert the stored data back into a Buffer
    const buffer = Buffer.from(bufferData.data);

    // Send the image as a response
    res.set({
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="scene-${id}.png"`,
    });
    res.send(buffer);
  } catch (error) {
    this.logger.error(`Error retrieving scene ${id}: ${error.message}`);
    throw new InternalServerErrorException("Failed to retrieve PNG");
  }
}

// scenes.controller.ts
@Get()
async getAllScenes() {
  this.logger.log("Fetching all scenes...");
  try {
    const allKeys = await this.storageService.getKeys(StorageNamespace.SCENES);

    const scenes = [];
    for (const key of allKeys) {
      if (key.endsWith("-data")) {
        const id = key.replace("-data", "");

        try {
          // Fetch both data and metadata
          const [bufferData, metadataBuffer] = await Promise.all([
            this.storageService.get(`${id}-data`, StorageNamespace.SCENES),
            this.storageService.get(`${id}-meta`, StorageNamespace.SCENES),
          ]);

          if (bufferData && metadataBuffer) {
            // Convert metadataBuffer to string and parse JSON
            const metadata = JSON.parse(Buffer.from(metadataBuffer.data).toString());

            scenes.push({
              id,
              metadata,
              image: `data:image/png;base64,${Buffer.from(bufferData.data).toString("base64")}`,
            });
          }
        } catch (error) {
          this.logger.error(`Error processing scene ${id}: ${error.message}`);
        }
      }
    }

    this.logger.log(`Found ${scenes.length} valid scenes.`);
    return scenes;
  } catch (error) {
    this.logger.error(`Error retrieving all scenes: ${error.message}`);
    throw new InternalServerErrorException("Failed to retrieve all scenes");
  }
}
}
