import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
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
      this.logger.warn(
        'CLOUDINARY_URL absent : ecriture locale dans UPLOAD_DEST (dev / fallback).',
      );
      return this.saveBufferToLocalUploads(buffer, options);
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
   * Sans Cloudinary : enregistre sous UPLOAD_DEST et renvoie une URL servie par /{API_PREFIX}/uploads/...
   */
  private async saveBufferToLocalUploads(
    buffer: Buffer,
    options: {
      folder: string;
      publicId?: string;
    },
  ): Promise<CloudinaryImageUploadResult> {
    const destRoot = this.config.get<string>('UPLOAD_DEST', './uploads');
    const ext = this.guessImageExtension(buffer);
    const safeFolder = options.folder.replace(/^\/+/, '').replace(/\\/g, '/');
    const rawName =
      options.publicId?.replace(/[^a-zA-Z0-9._-]/g, '_') ?? `img-${Date.now()}`;
    const relativePosix = `${safeFolder}/${rawName}.${ext}`;
    const diskPath = join(process.cwd(), destRoot, ...relativePosix.split('/'));
    await mkdir(dirname(diskPath), { recursive: true });
    await writeFile(diskPath, buffer);

    const apiPrefix = (
      this.config.get<string>('API_PREFIX', 'api/v1') || 'api/v1'
    ).replace(/^\/+|\/+$/g, '');
    const port =
      Number.parseInt(String(this.config.get('PORT', 3001)), 10) || 3001;
    const publicBase = (
      this.config.get<string>('PUBLIC_BASE_URL')?.trim() ||
      `http://localhost:${port}`
    ).replace(/\/$/, '');
    const secureUrl = `${publicBase}/${apiPrefix}/uploads/${relativePosix}`;

    return {
      secureUrl,
      publicId: relativePosix.replace(/\//g, '_'),
      format: ext,
    };
  }

  private guessImageExtension(buf: Buffer): string {
    if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
      return 'jpg';
    }
    if (
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47
    ) {
      return 'png';
    }
    if (buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
      return 'gif';
    }
    if (
      buf.length >= 12 &&
      buf[0] === 0x52 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[8] === 0x57 &&
      buf[9] === 0x45 &&
      buf[10] === 0x42 &&
      buf[11] === 0x50
    ) {
      return 'webp';
    }
    return 'jpg';
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
