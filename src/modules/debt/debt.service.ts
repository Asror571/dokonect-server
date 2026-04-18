import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DebtService {
    constructor(private prisma: PrismaService) { }

    async getClientDebts(clientId: string) {
        return this.prisma.debt.findMany({
            where: { clientId },
            include: {
                order: {
                    include: {
                        items: { include: { product: true } },
                    },
                },
                distributor: {
                    select: {
                        companyName: true,
                        phone: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getDistributorDebts(distributorId: string) {
        return this.prisma.debt.findMany({
            where: { distributorId },
            include: {
                order: {
                    include: {
                        items: { include: { product: true } },
                    },
                },
                client: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                phone: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
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
