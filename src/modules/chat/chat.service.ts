import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) { }

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

      if (!client) return [];

      const rooms = await this.prisma.chatRoom.findMany({
        where: { storeOwnerId: client.id },
        include: {
          distributor: {
            include: {
              user: {
                select: {
                  id: true,
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
          _count: {
            select: {
              messages: {
                where: {
                  isRead: false,
                  senderId: { not: userId },
                },
              },
            },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
      });

      return rooms.map(room => ({
        ...room,
        unreadCount: room._count.messages,
        lastMessage: room.messages[0] || null,
        participant: {
          id: room.distributor.id,
          name: room.distributor.companyName,
          avatar: room.distributor.logo,
          userId: room.distributor.userId,
        },
      }));
    } else if (role === 'DISTRIBUTOR') {
      const distributor = await this.prisma.distributor.findUnique({
        where: { userId },
      });

      if (!distributor) return [];

      const rooms = await this.prisma.chatRoom.findMany({
        where: { distributorId: distributor.id },
        include: {
          storeOwner: {
            include: {
              user: {
                select: {
                  id: true,
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
          _count: {
            select: {
              messages: {
                where: {
                  isRead: false,
                  senderId: { not: userId },
                },
              },
            },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
      });

      return rooms.map(room => ({
        ...room,
        unreadCount: room._count.messages,
        lastMessage: room.messages[0] || null,
        participant: {
          id: room.storeOwner.id,
          name: room.storeOwner.user.name,
          avatar: room.storeOwner.user.avatar,
          storeName: room.storeOwner.storeName,
          userId: room.storeOwner.userId,
        },
      }));
    }

    return [];
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
