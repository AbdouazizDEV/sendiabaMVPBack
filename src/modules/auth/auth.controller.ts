import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Headers,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiHeader,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import {
  AuthShowcaseResponseDto,
  AuthSuccessResponseDto,
  SessionStatusResponseDto,
} from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(200)
  @ApiOperation({
    summary:
      "cree un compte depuis l'onglet Inscription puis ouvre une session",
  })
  @ApiBody({ type: RegisterDto })
  @ApiOkResponse({ type: AuthSuccessResponseDto })
  async register(@Body() dto: RegisterDto): Promise<AuthSuccessResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: "authentifie un utilisateur depuis l'onglet Connexion",
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthSuccessResponseDto })
  @ApiUnauthorizedResponse({ description: 'Email ou mot de passe invalide.' })
  async login(@Body() dto: LoginDto): Promise<AuthSuccessResponseDto> {
    return this.authService.login(dto);
  }

  @Public()
  @Get('session')
  @ApiOperation({
    summary:
      'permet de savoir si l utilisateur est deja connecte pour redirection',
    description:
      'verifie la session (SignIn / Backoffice): role admin ou customer pour autoriser le dashboard',
  })
  @ApiHeader({
    name: 'authorization',
    required: false,
    description: 'Bearer access token optionnel',
  })
  @ApiOkResponse({ type: SessionStatusResponseDto })
  async session(
    @Headers('authorization') authorization?: string,
  ): Promise<SessionStatusResponseDto> {
    const accessToken = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : undefined;
    return this.authService.getSessionStatusByAccessToken(accessToken);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'renouvelle les tokens a partir du refresh token' })
  @ApiCookieAuth('refreshToken')
  @ApiOkResponse({ type: AuthSuccessResponseDto })
  @ApiUnauthorizedResponse({ description: 'Refresh token manquant ou invalide' })
  async refresh(@Req() request: Request): Promise<AuthSuccessResponseDto> {
    const refreshToken = (request.cookies as Record<string, string> | undefined)
      ?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token manquant');
    }
    return this.authService.refresh(refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Deconnexion de la session courante' })
  @ApiCookieAuth('refreshToken')
  @ApiOkResponse({
    schema: { example: { success: true, message: 'Session terminee' } },
  })
  async logout(@Req() request: Request): Promise<{ success: true; message: string }> {
    const refreshToken = (request.cookies as Record<string, string> | undefined)
      ?.refreshToken;
    if (!refreshToken) {
      return { success: true, message: 'Session terminee' };
    }
    const result = await this.authService.logout(refreshToken);
    return { success: true, message: result.message };
  }

  @Public()
  @Get('showcase')
  @ApiOperation({
    summary:
      'fournit la piece du moment et l artisan affiches sur le panneau visuel',
  })
  @ApiOkResponse({ type: AuthShowcaseResponseDto })
  async showcase(): Promise<AuthShowcaseResponseDto> {
    return this.authService.getShowcase();
  }

}
