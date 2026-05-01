import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: "Bildirishnomalar ro'yxati" })
  async getUserNotifications(@CurrentUser() user: any) {
    try {
      return await this.notificationService.getUserNotifications(user?.id);
    } catch {
      return [];
    }
  }

  @Get('unread-count')
  @ApiOperation({ summary: "O'qilmagan bildirishnomalar soni" })
  async getUnreadCount(@CurrentUser() user: any) {
    try {
      return await this.notificationService.getUnreadCount(user?.id);
    } catch {
      return { count: 0 };
    }
  }

  @Patch(':id/read')
  @ApiOperation({ summary: "Bildirishnomani o'qilgan deb belgilash" })
  markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: "Barchasini o'qilgan deb belgilash" })
  markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }
}
