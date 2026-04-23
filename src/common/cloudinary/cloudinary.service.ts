import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

export type CloudinaryImageUploadResult = {
  secureUrl: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
};

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const url = this.config.get<string>('CLOUDINARY_URL')?.trim();
    if (!url) {
      this.logger.warn(
        'CLOUDINARY_URL nest pas defini : les uploads d images echoueront.',
      );
      return;
    }
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'cloudinary:') {
        this.logger.warn(
          'CLOUDINARY_URL doit commencer par cloudinary:// (protocole invalide).',
        );
        return;
      }
      cloudinary.config({
        cloud_name: parsed.hostname,
        api_key: decodeURIComponent(parsed.username),
        api_secret: decodeURIComponent(parsed.password),
        secure: true,
      });
    } catch (e) {
      this.logger.warn(`CLOUDINARY_URL invalide : ${String(e)}`);
    }
  }

  isConfigured(): boolean {
    const cfg = cloudinary.config() as { cloud_name?: string };
    return Boolean(cfg.cloud_name);
  }

  /**
   * Envoie un buffer image vers Cloudinary (memory upload).
   */
  async uploadImageBuffer(
    buffer: Buffer,
    options: {
      folder: string;
      publicId?: string;
    },
  ): Promise<CloudinaryImageUploadResult> {
    if (!buffer?.length) {
      throw new BadRequestException({
        code: 'EMPTY_FILE',
        message: 'Fichier image vide ou manquant.',
      });
    }
    if (!this.isConfigured()) {
      throw new InternalServerErrorException({
        code: 'CLOUDINARY_NOT_CONFIGURED',
        message:
          'Cloudinary nest pas configure (CLOUDINARY_URL). Impossible d uploader l image.',
      });
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder,
          public_id: options.publicId,
          resource_type: 'image',
          overwrite: true,
          invalidate: true,
        },
        (err, result: UploadApiResponse | undefined) => {
          if (err || !result) {
            this.logger.error('Echec upload Cloudinary', err);
            const msg =
              err instanceof Error
                ? err.message
                : 'Echec de l upload vers Cloudinary.';
            reject(
              new InternalServerErrorException({
                code: 'CLOUDINARY_UPLOAD_FAILED',
                message: msg,
              }),
            );
            return;
          }
          resolve({
            secureUrl: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
          });
        },
      );
      Readable.from(buffer).pipe(uploadStream);
    });
  }

  /**
   * URL de livraison HTTPS avec transformations optionnelles.
   * @param publicId identifiant public Cloudinary (ex. sendiaba/artisans/ART-3021/profile)
   */
  buildImageUrl(
    publicId: string,
    transformations?: Record<string, string | number | boolean>,
  ): string {
    if (!this.isConfigured()) {
      throw new InternalServerErrorException({
        code: 'CLOUDINARY_NOT_CONFIGURED',
        message: 'Cloudinary nest pas configure.',
      });
    }
    return cloudinary.url(publicId, {
      secure: true,
      ...transformations,
    });
  }

  async destroyImage(publicId: string): Promise<void> {
    if (!this.isConfigured() || !publicId?.trim()) {
      return;
    }
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (e) {
      this.logger.warn(`Suppression Cloudinary ignoree : ${String(e)}`);
    }
  }
}
