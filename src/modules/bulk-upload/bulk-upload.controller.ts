import { Controller, Post, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { BulkUploadService } from './bulk-upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Bulk Upload')
@Controller('bulk-upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DISTRIBUTOR)
@ApiBearerAuth()
export class BulkUploadController {
  constructor(private bulkUploadService: BulkUploadService) {}

  @Post('products')
  @ApiOperation({ summary: 'Excel orqali mahsulotlarni yuklash' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadProducts(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('distributor') distributor: any,
  ) {
    return this.bulkUploadService.uploadProducts(file, distributor.id);
  }

  @Post('inventory')
  @ApiOperation({ summary: 'Excel orqali inventarni yangilash' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadInventory(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('distributor') distributor: any,
  ) {
    return this.bulkUploadService.uploadInventory(file, distributor.id);
  }
}
