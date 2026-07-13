import { z } from 'zod';

const noteType = z.enum(['FREE','CONTRADICTION','DIALECT']);
const content = z.string().trim().min(1).max(5000);
const suspectId = z.string().uuid().nullable();
const relatedRef = z.record(z.string(), z.unknown()).refine((value) => JSON.stringify(value).length <= 5000, 'relatedRef is too large');

export const createNoteSchema = z.object({
  noteType,
  content,
  suspectId: suspectId.default(null),
  relatedRef: relatedRef.default({})
}).strict();

export const updateNoteSchema = z.object({
  noteType: noteType.optional(),
  content: content.optional(),
  suspectId: suspectId.optional(),
  relatedRef: relatedRef.optional()
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required');
