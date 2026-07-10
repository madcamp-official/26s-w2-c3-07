import type { Interrogation } from './interrogation.types.js';

const interrogations: Interrogation[] = [];

export const interrogationRepository = {
  async create(data: Omit<Interrogation, 'id' | 'answer'>): Promise<Interrogation> {
    const interrogation = { ...data, id: crypto.randomUUID(), answer: 'Pending answer' };
    interrogations.push(interrogation);
    return interrogation;
  },
  async findAll() {
    return interrogations;
  }
};
