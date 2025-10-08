import { AdminSettings, ExamConfig, FeedbackRecord, GradeLevel, SubjectType, MessageTemplate, Student } from '../types';
import { getDefaultGradeCuts } from './gradeCalculator';

const STORAGE_KEY = 'exam_admin_settings';
const FEEDBACK_RECORDS_KEY = 'feedback_records';
const MESSAGE_TEMPLATE_KEY = 'message_template';
const LAST_DATE_KEY = 'last_access_date';

// localStorage에서 관리자 설정 불러오기
export function loadAdminSettings(): AdminSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load admin settings:', error);
  }
  
  // 기본값 반환
  return {
    middle3_high1: {},
    high2: {
      language_media: {},
      speech_writing: {}
    },
    high3: {
      language_media: {},
      speech_writing: {}
    }
  };
}

// localStorage에 관리자 설정 저장
export function saveAdminSettings(settings: AdminSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save admin settings:', error);
  }
}

// 특정 시험 설정 가져오기
export function getExamConfig(
  settings: AdminSettings,
  gradeLevel: string,
  examWeek: string,
  subjectType?: string
): ExamConfig | null {
  if (gradeLevel === 'middle3_high1') {
    return settings.middle3_high1[examWeek] || null;
  } else if (gradeLevel === 'high2' && subjectType) {
    return settings.high2[subjectType as 'language_media' | 'speech_writing'][examWeek] || null;
  } else if (gradeLevel === 'high3' && subjectType) {
    return settings.high3[subjectType as 'language_media' | 'speech_writing'][examWeek] || null;
  }
  return null;
}

// 특정 시험 설정 저장
export function setExamConfig(
  settings: AdminSettings,
  gradeLevel: string,
  examWeek: string,
  config: ExamConfig,
  subjectType?: string
): AdminSettings {
  const newSettings = JSON.parse(JSON.stringify(settings)); // Deep copy
  
  if (gradeLevel === 'middle3_high1') {
    newSettings.middle3_high1[examWeek] = config;
  } else if (gradeLevel === 'high2' && subjectType) {
    newSettings.high2[subjectType as 'language_media' | 'speech_writing'][examWeek] = config;
  } else if (gradeLevel === 'high3' && subjectType) {
    newSettings.high3[subjectType as 'language_media' | 'speech_writing'][examWeek] = config;
  }
  
  return newSettings;
}

// 기본 시험 설정 생성
export function createDefaultExamConfig(
  gradeLevel: string,
  examWeek: string,
  subjectType?: string
): ExamConfig {
  const baseConfig: ExamConfig = {
    gradeLevel: gradeLevel as any,
    examWeek,
    isHard: false,
    gradeCuts: getDefaultGradeCuts(),
    explanations: {
      reading_theory: [],
      reading: [],
      literature: []
    }
  };
  
  if (gradeLevel === 'middle3_high1') {
    baseConfig.explanations.grammar = [];
  } else if (subjectType === 'language_media') {
    baseConfig.subjectType = 'language_media';
    baseConfig.explanations.language_media = [];
  } else if (subjectType === 'speech_writing') {
    baseConfig.subjectType = 'speech_writing';
    baseConfig.explanations.speech_writing = [];
  }
  
  return baseConfig;
}

// 피드백 기록 저장
export function saveFeedbackRecord(studentData: Student): void {
  try {
    const records = loadFeedbackRecords();
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // "2025-10-05"
    
    const newRecord: FeedbackRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      studentData,
      timestamp: now.getTime(),
      date: today
    };
    
    records.push(newRecord);
    localStorage.setItem(FEEDBACK_RECORDS_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Failed to save feedback record:', error);
  }
}

// 피드백 기록 불러오기
export function loadFeedbackRecords(): FeedbackRecord[] {
  try {
    const saved = localStorage.getItem(FEEDBACK_RECORDS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load feedback records:', error);
  }
  return [];
}

// 오늘 피드백 기록만 가져오기
export function getTodayFeedbackRecords(): FeedbackRecord[] {
  const today = new Date().toISOString().split('T')[0];
  const allRecords = loadFeedbackRecords();
  return allRecords.filter(record => record.date === today);
}

// 특정 날짜의 피드백 기록 가져오기
export function getFeedbackRecordsByDate(date: string): FeedbackRecord[] {
  const allRecords = loadFeedbackRecords();
  return allRecords.filter(record => record.date === date);
}

// 피드백 기록 삭제
export function deleteFeedbackRecord(id: string): void {
  try {
    const records = loadFeedbackRecords();
    const filtered = records.filter(record => record.id !== id);
    localStorage.setItem(FEEDBACK_RECORDS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete feedback record:', error);
  }
}

// 오래된 피드백 기록 정리 (30일 이전 기록 삭제)
export function cleanupOldFeedbackRecords(daysToKeep: number = 30): void {
  try {
    const records = loadFeedbackRecords();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffTimestamp = cutoffDate.getTime();
    
    const filtered = records.filter(record => record.timestamp >= cutoffTimestamp);
    localStorage.setItem(FEEDBACK_RECORDS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to cleanup old feedback records:', error);
  }
}

// 자정이 지났는지 확인하고 오늘 기록 초기화
export function checkAndResetDailyRecords(): void {
  try {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = localStorage.getItem(LAST_DATE_KEY);
    
    if (lastDate !== today) {
      // 자정이 지남 - 마지막 접속 날짜 업데이트
      localStorage.setItem(LAST_DATE_KEY, today);
      
      // 오래된 기록은 유지하고 오늘 날짜만 업데이트
      // 실제로 오늘 기록은 아직 없으므로 아무것도 삭제하지 않음
    }
  } catch (error) {
    console.error('Failed to check and reset daily records:', error);
  }
}

// 기본 메시지 템플릿
export function getDefaultMessageTemplate(): MessageTemplate {
  return {
    closing: '이번 모의고사에서 {firstName}(이)는 차분하고 꼼꼼한 태도로 문제를 풀어주었습니다.',
    hardExamPhrase: '비교적 어려운 난이도의 시험이었습니다. 절대적 점수가 낮더라도 학생이 실망하지 않도록 격려해주세요.',
    normalExamPhrase: '',
    endingMessage: '앞으로도 좋은 성적을 낼 수 있도록 최선을 다해 돕겠습니다. 따뜻한 응원과 함께 지켜봐주세요. 감사합니다.'
  };
}

// 메시지 템플릿 불러오기
export function loadMessageTemplate(): MessageTemplate {
  try {
    const saved = localStorage.getItem(MESSAGE_TEMPLATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      
      // 구버전 템플릿 마이그레이션
      if (parsed.generalClosing || parsed.noneClosing || parsed.specificClosing) {
        // 이전 버전의 템플릿 구조를 새 구조로 변환
        const defaultTemplate = getDefaultMessageTemplate();
        return {
          closing: parsed.generalClosing || defaultTemplate.closing,
          hardExamPhrase: parsed.hardExamPhrase || defaultTemplate.hardExamPhrase,
          normalExamPhrase: parsed.normalExamPhrase || defaultTemplate.normalExamPhrase,
          endingMessage: parsed.endingMessage || defaultTemplate.endingMessage
        };
      }
      
      // 기존 템플릿에 endingMessage가 없으면 기본값 추가
      if (!parsed.endingMessage) {
        parsed.endingMessage = getDefaultMessageTemplate().endingMessage;
      }
      // closing이 없으면 기본값 추가
      if (!parsed.closing) {
        parsed.closing = getDefaultMessageTemplate().closing;
      }
      
      return parsed;
    }
  } catch (error) {
    console.error('Failed to load message template:', error);
  }
  return getDefaultMessageTemplate();
}

// 메시지 템플릿 저장
export function saveMessageTemplate(template: MessageTemplate): void {
  try {
    localStorage.setItem(MESSAGE_TEMPLATE_KEY, JSON.stringify(template));
  } catch (error) {
    console.error('Failed to save message template:', error);
  }
}

// 이번 주 모든 등급컷이 설정되었는지 확인
export function checkCurrentWeekGradeCutsSet(settings: AdminSettings, currentWeek: string): boolean {
  // 등급컷이 유효한지 확인하는 헬퍼 함수
  const hasValidGradeCuts = (config: any): boolean => {
    if (!config || !config.gradeCuts) return false;
    const cuts = config.gradeCuts;
    // 모든 등급컷이 0보다 큰 값인지 확인
    return cuts.grade1 > 0 && cuts.grade2 > 0 && cuts.grade3 > 0 && cuts.grade4 > 0;
  };

  // 중3/고1 체크
  const high1Config = settings.middle3_high1[currentWeek];
  if (!hasValidGradeCuts(high1Config)) {
    return false;
  }

  // 고2 언어와매체 체크
  const high2LMConfig = settings.high2.language_media[currentWeek];
  if (!hasValidGradeCuts(high2LMConfig)) {
    return false;
  }

  // 고2 화법과작문 체크
  const high2SWConfig = settings.high2.speech_writing[currentWeek];
  if (!hasValidGradeCuts(high2SWConfig)) {
    return false;
  }

  // 고3 언어와매체 체크
  const high3LMConfig = settings.high3.language_media[currentWeek];
  if (!hasValidGradeCuts(high3LMConfig)) {
    return false;
  }

  // 고3 화법과작문 체크
  const high3SWConfig = settings.high3.speech_writing[currentWeek];
  if (!hasValidGradeCuts(high3SWConfig)) {
    return false;
  }

  return true;
}
