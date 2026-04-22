import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PublicContentService {
  constructor(private readonly prisma: PrismaService) {}

  async getByScope(scope: string): Promise<{
    scope: string;
    entries: Record<string, string>;
  }> {
    const rows = await this.prisma.contentEntry.findMany({
      where: { scope },
      orderBy: { key: 'asc' },
    });
    const entries: Record<string, string> = {};
    for (const row of rows) {
      entries[row.key] = row.overrideValue ?? row.defaultValue;
    }
    return { scope, entries };
  }
}
