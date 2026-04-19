import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createMessage(data: { roomId: string; senderId: string; content: string }) {
    return this.prisma.message.create({
      data: {
        chatRoomId: data.roomId,
        senderId: data.senderId,
        content: data.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  async getChatRooms(userId: string, role: string) {
    if (role === 'CLIENT') {
      const client = await this.prisma.client.findUnique({
        where: { userId },
      });
      return this.prisma.chatRoom.findMany({
        where: { storeOwnerId: client.id },
        include: {
          distributor: {
            select: {
              companyName: true,
              logo: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
    } else if (role === 'DISTRIBUTOR') {
      const distributor = await this.prisma.distributor.findUnique({
        where: { userId },
      });
      return this.prisma.chatRoom.findMany({
        where: { distributorId: distributor.id },
        include: {
          storeOwner: {
            include: {
              user: {
                select: {
                  name: true,
                  avatar: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
    }
  }

  async getMessages(roomId: string) {
    return this.prisma.message.findMany({
      where: { chatRoomId: roomId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
