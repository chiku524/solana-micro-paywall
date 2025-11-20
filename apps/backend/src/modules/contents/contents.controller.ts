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
import { ContentsService } from './contents.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { ContentQueryDto } from './dto/content-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Merchant } from '../../common/decorators/merchant.decorator';

@Controller('contents')
export class ContentsController {
  private readonly logger = new Logger(ContentsController.name);

  constructor(private readonly contentsService: ContentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() dto: CreateContentDto, @Merchant() user: any) {
    // Ensure merchant can only create content for themselves
    if (dto.merchantId !== user.merchantId) {
      throw new Error('Unauthorized: Cannot create content for another merchant');
    }
    return this.contentsService.create(dto);
  }

  @Get()
  @Public()
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() query: ContentQueryDto) {
    return this.contentsService.findAll(query);
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return this.contentsService.findOne(id);
  }

  @Get(':id/stats')
  async getStats(@Param('id') id: string) {
    return this.contentsService.getContentStats(id);
  }

  @Get('merchant/:merchantId/slug/:slug')
  @Public()
  async findBySlug(@Param('merchantId') merchantId: string, @Param('slug') slug: string) {
    return this.contentsService.findBySlug(merchantId, slug);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(@Param('id') id: string, @Body() dto: UpdateContentDto, @Merchant() user: any) {
    // Verify merchant owns this content
    const contentData = await this.contentsService.findOne(id);
    const content = contentData as any; // Type assertion for cached data
    if (content.merchantId !== user.merchantId) {
      throw new Error('Unauthorized: Cannot update content owned by another merchant');
    }
    return this.contentsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Merchant() user: any) {
    // Verify merchant owns this content
    const contentData = await this.contentsService.findOne(id);
    const content = contentData as any; // Type assertion for cached data
    if (content.merchantId !== user.merchantId) {
      throw new Error('Unauthorized: Cannot delete content owned by another merchant');
    }
    return this.contentsService.remove(id);
  }
}

