#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/4f9dd61b93174f3147e0cd0315c867174f5535cc7d8cd8234fe73dc0bb19b759/contract';
import endContract from '../../snapshots/4f9dd61b93174f3147e0cd0315c867174f5535cc7d8cd8234fe73dc0bb19b759/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/a98b30a8e34766794f71cd8c4353f09dbe6385274a89cf6b674b66bc09e7d3a5/contract';
import startContract from '../../snapshots/a98b30a8e34766794f71cd8c4353f09dbe6385274a89cf6b674b66bc09e7d3a5/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({ schema: 'public', table: 'restaurants', column: 'email' }),
      this.dropColumn({ schema: 'public', table: 'restaurants', column: 'phone_number' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
