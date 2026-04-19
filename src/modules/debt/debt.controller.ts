import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DebtService } from './debt.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Debts')
@Controller('debts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DebtController {
  constructor(private debtService: DebtService) {}

  @Get('client')
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Client qarzlari' })
  getClientDebts(@CurrentUser('client') client: any) {
    return this.debtService.getClientDebts(client.id);
  }

  @Get('distributor')
  @UseGuards(RolesGuard)
  @Roles(Role.DISTRIBUTOR)
  @ApiOperation({ summary: 'Distributor qarzlari' })
  getDistributorDebts(@CurrentUser('distributor') distributor: any) {
    return this.debtService.getDistributorDebts(distributor.id);
  }

  @Post(':debtId/pay')
  @ApiOperation({ summary: "Qarzni to'lash" })
  payDebt(@Param('debtId') debtId: string, @Body('amount') amount: number) {
    return this.debtService.payDebt(debtId, amount);
  }

  @Get('summary')
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Qarz xulosasi' })
  getDebtSummary(@CurrentUser('client') client: any) {
    return this.debtService.getDebtSummary(client.id);
  }
}
