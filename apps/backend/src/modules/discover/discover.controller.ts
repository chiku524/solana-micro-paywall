import {
  Controller,
  Get,
  Query,
  Param,
  Logger,
  ValidationPipe,
  UsePipes,
  ParseIntPipe,
} from '@nestjs/common';
import { DiscoverService } from './discover.service';
import { DiscoverQueryDto } from './dto/discover-query.dto';

@Controller('discover')
export class DiscoverController {
  private readonly logger = new Logger(DiscoverController.name);

  constructor(private readonly discoverService: DiscoverService) {}

  @Get('contents')
  @UsePipes(new ValidationPipe({ transform: true }))
  async discoverContents(@Query() query: DiscoverQueryDto) {
    return this.discoverService.discoverContents(query);
  }

  @Get('contents/:id')
  async getContentDetails(@Param('id') id: string) {
    return this.discoverService.getContentDetails(id);
  }

  @Get('merchants/:merchantId/contents')
  async getMerchantContents(
    @Param('merchantId') merchantId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.discoverService.getMerchantContents(merchantId, {
      page: page || 1,
      limit: limit || 20,
    });
  }

  @Get('categories')
  async getCategories() {
    return this.discoverService.getCategories();
  }

  @Get('trending')
  async getTrending(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.discoverService.getTrending(limit || 10);
  }
}

