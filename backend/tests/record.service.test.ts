import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { recordRepository as repository } from '../src/modules/record/record.repository.js';
import { createNoteSchema, updateNoteSchema } from '../src/modules/record/record.schema.js';
import { recordService } from '../src/modules/record/record.service.js';

const userId='00000000-0000-4000-8000-000000000001';
const sessionId='00000000-0000-4000-8000-000000000002';
const episodeId='00000000-0000-4000-8000-000000000003';
const suspectId='00000000-0000-4000-8000-000000000004';
const noteId='00000000-0000-4000-8000-000000000005';
const now=new Date().toISOString();
const overview={id:episodeId,code:'GS-01',title:'종가의 밤',location:'안동 종가',incidentType:'살인 사건',synopsis:'공개 사건 소개',status:'available',victim:{name:'김수현',age:68,occupation:'대주'}};
const evidence=[{id:'e1',code:'GS-01-E1',title:'식혜 그릇',description:'확인한 증거',evidenceType:'physical',viewedAt:now}];
const testimonies=[{id:'m1',suspectId,suspectName:'이순임',question:'어디에 있었습니까?',response:'정지에 있었심더.',questionType:'Q-PLACE',emotion:'NERVOUS',createdAt:now}];
const timeline=[{id:'t1',occurredAt:'22:00',title:'사건 발견',description:'공개된 동선'}];
const clues=[{id:'c1',code:'GS-01-C1',title:'독성 물질',description:'획득 단서',clueType:'CORE',unlockedAt:now}];
const dialects=[{id:'d1',code:'GS-01-D1',dialectText:'정지',usageContext:'장소 표현'}];
const relationships=[{id:'r1',suspect:{id:suspectId,name:'이순임'},relationshipType:'family',description:'공개 관계',relatedSuspect:null,victim:{id:'v1',name:'김수현'}}];
const note={id:noteId,sessionId,noteType:'FREE' as const,content:'확인 메모',suspectId:null,relatedRef:{},createdAt:now,updatedAt:now};

beforeEach(()=>{
  vi.spyOn(repository,'findOwnedSession').mockResolvedValue({id:sessionId,user_id:userId,episode_id:episodeId,status:'INTERROGATING'});
  vi.spyOn(repository,'findOverview').mockResolvedValue({overview,regionId:'region-1'});
  vi.spyOn(repository,'acquiredClueIds').mockResolvedValue(['c1']);
  vi.spyOn(repository,'findEvidence').mockResolvedValue(evidence);
  vi.spyOn(repository,'findTestimonies').mockResolvedValue(testimonies);
  vi.spyOn(repository,'findTimeline').mockResolvedValue(timeline);
  vi.spyOn(repository,'findClues').mockResolvedValue(clues);
  vi.spyOn(repository,'findDialects').mockResolvedValue(dialects);
  vi.spyOn(repository,'findRelationships').mockResolvedValue(relationships);
  vi.spyOn(repository,'findNotes').mockResolvedValue([note]);
  vi.spyOn(repository,'suspectBelongs').mockResolvedValue(true);
  vi.spyOn(repository,'createNote').mockResolvedValue(note);
  vi.spyOn(repository,'updateNote').mockResolvedValue({...note,content:'수정 메모'});
  vi.spyOn(repository,'deleteNote').mockResolvedValue(true);
});
afterEach(()=>vi.restoreAllMocks());

describe('investigation records',()=>{
  it('returns every record tab in one response without sensitive testimony fields',async()=>{
    const result=await recordService.records(sessionId,userId);
    expect(result).toEqual({caseOverview:overview,evidence,testimonies,timeline,clues,dialectExpressions:dialects,relationships,notes:[note]});
    const json=JSON.stringify(result);
    expect(json).not.toContain('usedFact'); expect(json).not.toContain('actualRoute'); expect(json).not.toContain('standardMeaning');
    expect(repository.findDialects).toHaveBeenCalledWith(episodeId,false);
  });

  it('returns empty arrays for a new session record',async()=>{
    for(const method of ['findEvidence','findTestimonies','findTimeline','findClues','findDialects','findRelationships','findNotes'] as const) vi.mocked(repository[method]).mockResolvedValue([]);
    await expect(recordService.records(sessionId,userId)).resolves.toMatchObject({evidence:[],testimonies:[],timeline:[],clues:[],dialectExpressions:[],relationships:[],notes:[]});
  });

  it('blocks another user from every record tab',async()=>{
    vi.mocked(repository.findOwnedSession).mockResolvedValue(null);
    await expect(recordService.records(sessionId,'other-user')).rejects.toMatchObject({code:'SESSION_NOT_FOUND'});
  });

  it('reveals dialect standard meaning only after completion',async()=>{
    vi.mocked(repository.findOwnedSession).mockResolvedValue({id:sessionId,user_id:userId,episode_id:episodeId,status:'COMPLETED'});
    await recordService.records(sessionId,userId);
    expect(repository.findDialects).toHaveBeenCalledWith(episodeId,true);
  });
});

describe('record visibility boundaries',()=>{
  const source=readFileSync(new URL('../src/modules/record/record.repository.ts',import.meta.url),'utf8');
  const migration=readFileSync(new URL('../supabase/migrations/20260713044823_add_investigation_records_and_notes.sql',import.meta.url),'utf8');
  it('loads only public or clue-unlocked timelines',()=>{
    expect(source).toContain(".in('visibility', ['PUBLIC_INITIAL', 'SESSION_UNLOCKED'])");
    expect(source).not.toContain(".eq('visibility','PRIVATE')");
  });
  it('never queries hidden relationships',()=>{
    expect(source).toContain(".eq('disclosure_level', 'PUBLIC')");
    expect(source).not.toContain(".eq('visibility','HIDDEN')");
  });
  it('does not select actual routes and validates note scope in the database',()=>{
    expect(source).not.toContain('actual_route'); expect(source).not.toContain('claimed_route');
    expect(migration).toContain('NOTE_SESSION_NOT_OWNED'); expect(migration).toContain('NOTE_SUSPECT_NOT_IN_EPISODE');
    expect(migration).toContain("set search_path = ''");
  });
});

describe('user notes',()=>{
  const input={noteType:'FREE' as const,content:'확인 메모',suspectId:null,relatedRef:{}};
  it('creates a note owned by the session user',async()=>{await expect(recordService.createNote(sessionId,userId,input)).resolves.toEqual(note);expect(repository.createNote).toHaveBeenCalledWith(sessionId,userId,input)});
  it('updates only an owned note',async()=>{await expect(recordService.updateNote(sessionId,userId,noteId,{content:'수정 메모'})).resolves.toMatchObject({content:'수정 메모'});expect(repository.updateNote).toHaveBeenCalledWith(sessionId,userId,noteId,{content:'수정 메모'})});
  it('deletes only an owned note',async()=>{await expect(recordService.deleteNote(sessionId,userId,noteId)).resolves.toEqual({deleted:true,noteId});expect(repository.deleteNote).toHaveBeenCalledWith(sessionId,userId,noteId)});
  it('hides another users note as not found',async()=>{vi.mocked(repository.updateNote).mockResolvedValue(null);await expect(recordService.updateNote(sessionId,userId,noteId,{content:'침입'})).rejects.toMatchObject({code:'NOTE_NOT_FOUND'})});
  it('validates note input and rejects an empty patch',()=>{
    expect(createNoteSchema.safeParse(input).success).toBe(true);
    expect(createNoteSchema.safeParse({...input,noteType:'SECRET'}).success).toBe(false);
    expect(updateNoteSchema.safeParse({}).success).toBe(false);
  });
});
