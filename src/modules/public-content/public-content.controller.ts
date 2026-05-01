import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import {
  PublicContentQueryDto,
  PublicContentResponseDto,
} from './dto/public-content.dto';
import { PublicContentService } from './public-content.service';

@ApiTags('Content (public)')
@Controller('content')
@Public()
export class PublicContentController {
  constructor(private readonly publicContentService: PublicContentService) {}

  @Get()
  @ApiOperation({
    summary: 'Textes CMS par scope',
    description:
      'retourne les entrées effectives (override ou défaut) pour une page (ex: cart)',
  })
  @ApiQuery({ name: 'scope', required: false, example: 'home' })
  @ApiOkResponse({ type: PublicContentResponseDto })
  async getByScope(
    @Query() query: PublicContentQueryDto,
  ): Promise<PublicContentResponseDto> {
    return this.publicContentService.getByScope(query.scope ?? 'home');
  }
}
