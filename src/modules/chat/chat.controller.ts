import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private chatService: ChatService) { }

  @Get('rooms')
  @ApiOperation({ summary: "Foydalanuvchining barcha chat xonalari (token orqali)" })
  getChatRooms(@CurrentUser() user: any) {
    return this.chatService.getChatRooms(user.id, user.role);
  }

  @Get('rooms/:roomId/messages')
  @ApiOperation({ summary: "Chat xonasidagi barcha xabarlar" })
  getMessages(@Param('roomId') roomId: string) {
    return this.chatService.getMessages(roomId);
  }
}
