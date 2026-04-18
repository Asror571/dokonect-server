import {
    Controller,
    Post,
    Delete,
    Body,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
    constructor(private uploadService: UploadService) { }

    @Post('single')
    @ApiOperation({ summary: 'Bitta rasm yuklash' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    uploadSingle(
        @UploadedFile() file: Express.Multer.File,
        @Body('folder') folder?: string,
    ) {
        return this.uploadService.uploadSingle(file, folder);
    }

    @Post('multiple')
    @ApiOperation({ summary: 'Ko\'p rasm yuklash' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FilesInterceptor('files', 10))
    uploadMultiple(
        @UploadedFiles() files: Express.Multer.File[],
        @Body('folder') folder?: string,
    ) {
        return this.uploadService.uploadMultiple(files, folder);
    }

    @Delete()
    @ApiOperation({ summary: 'Rasmni o\'chirish' })
    deleteImage(@Body('publicId') publicId: string) {
        return this.uploadService.deleteImage(publicId);
    }
}
