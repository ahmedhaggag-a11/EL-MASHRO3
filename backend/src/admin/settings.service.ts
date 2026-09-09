import { Injectable } from '@nestjs/common';
import { PrismaService } from '../config/prisma.service';

const DEFAULTS: Record<string, string> = {
  COMMISSION_PERCENT: '15',        // platform keeps 15% by default
  IN_PERSON_SURCHARGE_PCT: '10',   // in-person sessions priced 10% higher
};

// All "business knobs" (commission %, surcharge %, etc.) are read
// through here — never hard-coded — so admins change them from the
// dashboard without a deploy. Values are cached in Redis in production
// (see infra notes in README); this in-memory fallback keeps local
// dev simple.
@Injectable()
export class SettingsService {
  private cache = new Map<string, string>();

  constructor(private prisma: PrismaService) {}

  async get(key: string): Promise<string> {
    if (this.cache.has(key)) return this.cache.get(key)!;

    const row = await this.prisma.platformSetting.findUnique({ where: { key } });
    const value = row?.value ?? DEFAULTS[key];
    if (value === undefined) throw new Error(`Unknown setting key: ${key}`);

    this.cache.set(key, value);
    return value;
  }

  async getNumber(key: string): Promise<number> {
    return Number(await this.get(key));
  }

  async set(key: string, value: string) {
    await this.prisma.platformSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    this.cache.set(key, value);
  }

  // Student pays 200 EGP, commission 15% → tutor gets 170, platform keeps 30.
  async splitPayment(amountEGP: number) {
    const commissionPct = await this.getNumber('COMMISSION_PERCENT');
    const platformFeeEGP = Math.round((amountEGP * commissionPct) / 100);
    const tutorEarningsEGP = amountEGP - platformFeeEGP;
    return { platformFeeEGP, tutorEarningsEGP };
  }
}
