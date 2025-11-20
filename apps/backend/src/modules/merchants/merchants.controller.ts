import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  ValidationPipe,
  UsePipes,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MerchantsService } from './merchants.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { MerchantQueryDto } from './dto/merchant-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Merchant } from '../../common/decorators/merchant.decorator';

@ApiTags('merchants')
@Controller('merchants')
export class MerchantsController {
  private readonly logger = new Logger(MerchantsController.name);

  constructor(private readonly merchantsService: MerchantsService) {}

  @Post()
  @Public()
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() dto: CreateMerchantDto) {
    return this.merchantsService.create(dto);
  }

  @Get()
  @Public()
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() query: MerchantQueryDto) {
    return this.merchantsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Merchant() user: any) {
    // Merchants can only view their own data unless it's a public endpoint
    if (id !== user.merchantId) {
      throw new Error('Unauthorized: Cannot access another merchant\'s data');
    }
    return this.merchantsService.findOne(id);
  }

  @Get(':id/dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get merchant dashboard statistics' })
  async getDashboard(@Param('id') id: string, @Merchant() user: any) {
    // Merchants can only view their own dashboard
    if (id !== user.merchantId) {
      throw new Error('Unauthorized: Cannot access another merchant\'s dashboard');
    }
    return this.merchantsService.getDashboardStats(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(@Param('id') id: string, @Body() dto: UpdateMerchantDto, @Merchant() user: any) {
    // Merchants can only update their own data
    if (id !== user.merchantId) {
      throw new Error('Unauthorized: Cannot update another merchant\'s data');
    }
    return this.merchantsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Merchant() user: any) {
    // Merchants can only delete their own account
    if (id !== user.merchantId) {
      throw new Error('Unauthorized: Cannot delete another merchant\'s account');
    }
    return this.merchantsService.remove(id);
  }
}

