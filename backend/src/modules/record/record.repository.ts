import type { RecordEntry } from './record.types.js';

const records: RecordEntry[] = [];

export const recordRepository = {
  async findAll() {
    return records;
  }
};
