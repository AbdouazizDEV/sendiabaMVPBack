import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import {
  CreateNewsletterSubscriptionDto,
  CreateNewsletterSubscriptionResponseDto,
} from './dto/newsletter.dto';
import { NewsletterService } from './newsletter.service';

@ApiTags('Newsletter')
@Public()
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscriptions')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Newsletter subscription',
    description: 'cree une inscription newsletter depuis la homepage',
  })
  @ApiOkResponse({ type: CreateNewsletterSubscriptionResponseDto })
  async createSubscription(
    @Body() dto: CreateNewsletterSubscriptionDto,
  ): Promise<CreateNewsletterSubscriptionResponseDto> {
    return this.newsletterService.createSubscription(dto);
  }
}
