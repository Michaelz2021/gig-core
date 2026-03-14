import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { ProviderAdsUploadController } from './provider-ads-upload.controller';
import { ProjectsUploadController } from './projects-upload.controller';
import { UploadService } from './upload.service';
import { S3Service } from './s3.service';

@Module({
  controllers: [UploadController, ProviderAdsUploadController, ProjectsUploadController],
  providers: [UploadService, S3Service],
  exports: [UploadService, S3Service],
})
export class UploadModule {}

