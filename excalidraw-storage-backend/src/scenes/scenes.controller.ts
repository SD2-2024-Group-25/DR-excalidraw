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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { customAlphabet } from 'nanoid';
import * as fs from 'fs';
import * as path from 'path';
import * as JSZip from 'jszip';

@Controller('scenes')
export class ScenesController {
  private readonly logger = new Logger(ScenesController.name);
  private readonly uploadDir = path.join(__dirname, '../../../../new_clone/dungeon-revealer/public/research/whiteboard'); //'../../uploads'); // Define upload directory

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true }); // Ensure the directory exists
    }
  }

  @Post('save')
  @UseInterceptors(FileInterceptor('image'))
  async savePng(
    @UploadedFile() imageFile: Express.Multer.File,
    @Body('username') username: string,
    @Body('userID') userID: string,
  ) {
    const nanoid = customAlphabet('0123456789', 16)();
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .split('.')[0]; // Format: YYYYMMDD_HHMMSS

    try {
      if (!imageFile)
        throw new InternalServerErrorException('No PNG file provided');
      if (!username)
        throw new InternalServerErrorException('Username is required');

      const sanitizedUsername = username.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileID = `${timestamp}_${sanitizedUsername}_${nanoid}`;

      const metadata = {
        id: nanoid,
        username: sanitizedUsername,
        userID: userID || 'COLLAB',
        fileType: imageFile.mimetype,
        createdAt: new Date().toISOString(),
      };

      const imagePath = path.join(this.uploadDir, `${fileID}.png`);
      const metadataPath = path.join(this.uploadDir, `${fileID}.json`);

      // Save image and metadata
      fs.writeFileSync(imagePath, imageFile.buffer);
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      this.logger.log(
        `Saved PNG as ${fileID}.png for username ${sanitizedUsername}`,
      );

      return {
        id: nanoid,
        filename: `${fileID}.png`,
        message: 'PNG saved successfully',
        username: sanitizedUsername,
        userID: userID || 'unknown',
      };
    } catch (error) {
      this.logger.error(`Error saving PNG: ${error.message}`);
      throw new InternalServerErrorException('Failed to save PNG');
    }
  }

  @Get('download')
  async downloadAllScenes(@Res() res: Response) {
    this.logger.log('Preparing to download all scenes...');
    try {
      const files = fs.readdirSync(this.uploadDir);
      const archive = new JSZip();

      for (const file of files) {
        if (file.endsWith('.png')) {
          const id = file.replace('.png', '');
          const imagePath = path.join(this.uploadDir, file);
          const metadataPath = path.join(this.uploadDir, `${id}.json`);

          if (fs.existsSync(metadataPath)) {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
            const imageData = fs.readFileSync(imagePath);
            archive.file(`${metadata.id}_${metadata.username}.png`, imageData);
          }
        }
      }

      if (Object.keys(archive.files).length === 0) {
        this.logger.warn('No valid scenes to include in the ZIP archive.');
        throw new NotFoundException('No scenes found.');
      }

      const zipBuffer = await archive.generateAsync({ type: 'nodebuffer' });

      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="scenes.zip"',
      });
      res.send(zipBuffer);

      this.logger.log(
        `Successfully sent ZIP file containing ${
          Object.keys(archive.files).length
        } scenes.`,
      );
    } catch (error) {
      this.logger.error(`Error downloading scenes: ${error.message}`);
      throw new InternalServerErrorException('Failed to download scenes.');
    }
  }

@Get(':id')
async getPng(@Param('id') id: string, @Res() res: Response) {
  this.logger.log(`🔎 Looking for scene: ${id}`);

  const files = fs.readdirSync(this.uploadDir); // Get all files in uploads folder
  this.logger.log(`📂 Files in upload directory: ${files.join(', ')}`); // Log files
  
  try {
    // Check for a file that contains the ID
    const matchingFile = files.find(file => file.includes(id) && file.endsWith('.png'));

    if (!matchingFile) {
      this.logger.error(`❌ Scene ${id} not found.`);
      throw new NotFoundException(`Scene ${id} not found`);
    }

    const imagePath = path.join(this.uploadDir, matchingFile);
    const imageBuffer = fs.readFileSync(imagePath);

    this.logger.log(`✅ Found and returning file: ${matchingFile}`);

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `inline; filename="${matchingFile}"`,
    });
    res.send(imageBuffer);
  } catch (error) {
    this.logger.error(`🚨 Error retrieving scene ${id}: ${error.message}`);
    throw new InternalServerErrorException('Failed to retrieve PNG');
  }
}

  @Get()
async getAllScenes() {
  this.logger.log('Fetching all scenes...');
  
  try {
    const files = fs.readdirSync(this.uploadDir);
    this.logger.log(`📂 Detected files: ${files.join(', ')}`);

    const scenes = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const metadataPath = path.join(this.uploadDir, file);
          this.logger.log(`📄 Processing metadata file: ${metadataPath}`);

          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

          // 🔹 Find a PNG file that contains this ID
          const matchingFile = files.find(f => f.includes(metadata.id) && f.endsWith('.png'));

          if (!matchingFile) {
            this.logger.warn(`⚠️ Image file missing for scene ID: ${metadata.id}`);
            continue; // Skip this scene if no matching image
          }

          const imagePath = path.join(this.uploadDir, matchingFile);
          const imageBuffer = fs.readFileSync(imagePath);

          this.logger.log(`✅ Found and returning scene: ${matchingFile}`);

          scenes.push({
            id: metadata.id,
            metadata,
            image: `data:image/png;base64,${imageBuffer.toString('base64')}`,
          });

        } catch (error) {
          this.logger.error(`🚨 Error processing scene file ${file}: ${error.message}`);
        }
      }
    }

    this.logger.log(`📊 Found ${scenes.length} valid scenes.`);
    return scenes;

  } catch (error) {
    this.logger.error(`❌ Error retrieving all scenes: ${error.message}`);
    throw new InternalServerErrorException('Failed to retrieve all scenes');
  }
}
}
