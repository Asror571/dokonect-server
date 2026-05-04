import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DebtService {
  constructor(private prisma: PrismaService) { }

  async getClientDebts(clientId: string) {
    const debts = await this.prisma.debt.findMany({
      where: { clientId },
      include: {
        order: {
          select: {
            id: true,
            // orderNumber: true, // TODO: Uncomment after prisma generate
            createdAt: true,
            totalAmount: true,
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    images: true,
                  },
                },
              },
            },
          },
        },
        distributor: {
          select: {
            id: true,
            companyName: true,
            phone: true,
            logo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Qo'shimcha statistika
    const summary = {
      total: debts.length,
      unpaid: debts.filter(d => d.status === 'UNPAID').length,
      partial: debts.filter(d => d.status === 'PARTIAL').length,
      paid: debts.filter(d => d.status === 'PAID').length,
      overdue: debts.filter(d => d.status === 'OVERDUE').length,
      totalAmount: debts.reduce((sum, d) => sum + d.remainingAmount, 0),
    };

    return {
      debts,
      summary,
    };
  }

  async getDistributorDebts(distributorId: string) {
    const debts = await this.prisma.debt.findMany({
      where: { distributorId },
      include: {
        order: {
          select: {
            id: true,
            // orderNumber: true, // TODO: Uncomment after prisma generate
            createdAt: true,
            totalAmount: true,
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    images: true,
                  },
                },
              },
            },
          },
        },
        client: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Distribyutor uchun statistika
    const summary = {
      total: debts.length,
      unpaid: debts.filter(d => d.status === 'UNPAID').length,
      partial: debts.filter(d => d.status === 'PARTIAL').length,
      paid: debts.filter(d => d.status === 'PAID').length,
      overdue: debts.filter(d => d.status === 'OVERDUE').length,
      totalReceivable: debts.reduce((sum, d) => sum + d.remainingAmount, 0),
      totalReceived: debts.reduce((sum, d) => sum + d.paidAmount, 0),
    };

    return {
      debts,
      summary,
    };
  }

  async payDebt(debtId: string, amount: number) {
    const debt = await this.prisma.debt.findUnique({
      where: { id: debtId },
    });

    if (!debt) {
      throw new NotFoundException('Qarz topilmadi');
    }

    const newPaidAmount = debt.paidAmount + amount;
    const newRemainingAmount = debt.originalAmount - newPaidAmount;

    let status = debt.status;
    if (newRemainingAmount <= 0) {
      status = 'PAID';
    } else if (newPaidAmount > 0) {
      status = 'PARTIAL';
    }

    return this.prisma.debt.update({
      where: { id: debtId },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status,
      },
    });
  }

  async getDebtSummary(clientId: string) {
    const debts = await this.prisma.debt.findMany({
      where: { clientId },
    });

    const totalDebt = debts.reduce((sum, d) => sum + d.remainingAmount, 0);
    const totalPaid = debts.reduce((sum, d) => sum + d.paidAmount, 0);

    const now = new Date();
    const overdueDebts = debts.filter((d) => d.dueDate && d.dueDate < now && d.status !== 'PAID');

    return {
      totalDebt,
      totalPaid,
      overdueCount: overdueDebts.length,
      overdueAmount: overdueDebts.reduce((sum, d) => sum + d.remainingAmount, 0),
    };
  }
}
