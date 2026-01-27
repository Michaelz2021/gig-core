import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') || 'ap-southeast-1';
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || '';

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });

    if (!this.bucketName) {
      this.logger.warn('AWS_S3_BUCKET is not configured. S3 operations will fail.');
    }
  }

  /**
   * Create a folder (prefix) in S3
   * In S3, folders don't exist as separate objects, but we can create an empty object with a trailing slash
   */
  async createFolder(folderPath: string): Promise<string> {
    if (!this.bucketName) {
      throw new Error('S3 bucket is not configured');
    }

    // Ensure folder path ends with /
    const normalizedPath = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;

    try {
      // Create a placeholder object to represent the folder
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: normalizedPath,
        Body: '',
      });

      await this.s3Client.send(command);
      this.logger.log(`Folder created: ${normalizedPath}`);
      return normalizedPath;
    } catch (error) {
      this.logger.error(`Failed to create folder: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Upload a file to S3
   */
  async uploadFile(
    filePath: string,
    fileContent: Buffer | string,
    contentType?: string,
  ): Promise<string> {
    if (!this.bucketName) {
      throw new Error('S3 bucket is not configured');
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
        Body: typeof fileContent === 'string' ? Buffer.from(fileContent) : fileContent,
        ContentType: contentType || 'application/octet-stream',
      });

      await this.s3Client.send(command);
      const fileUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${filePath}`;
      this.logger.log(`File uploaded: ${fileUrl}`);
      return fileUrl;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Upload a file from Express Multer file object
   */
  async uploadMulterFile(
    file: Express.Multer.File,
    folderPath: string,
  ): Promise<string> {
    const fileName = `${Date.now()}_${file.originalname}`;
    const filePath = `${folderPath}${fileName}`;
    return this.uploadFile(filePath, file.buffer, file.mimetype);
  }

  /**
   * Get a signed URL for a file (temporary access)
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    if (!this.bucketName) {
      throw new Error('S3 bucket is not configured');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      this.logger.error(`Failed to get signed URL: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * List files in a folder
   */
  async listFiles(folderPath: string): Promise<string[]> {
    if (!this.bucketName) {
      throw new Error('S3 bucket is not configured');
    }

    try {
      const normalizedPath = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: normalizedPath,
      });

      const response = await this.s3Client.send(command);
      const files = (response.Contents || [])
        .filter((item) => item.Key && !item.Key.endsWith('/')) // Exclude folder markers
        .map((item) => item.Key!);

      return files;
    } catch (error) {
      this.logger.error(`Failed to list files: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(filePath: string): Promise<void> {
    if (!this.bucketName) {
      throw new Error('S3 bucket is not configured');
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(filePath: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${filePath}`;
  }
}

