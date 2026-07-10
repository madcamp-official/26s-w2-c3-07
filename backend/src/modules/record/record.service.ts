import { recordRepository } from './record.repository.js';

export const recordService = {
  async listRecords() {
    return recordRepository.findAll();
  }
};
