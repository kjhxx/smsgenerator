// 학년 타입
export type GradeLevel = 'middle3_high1' | 'high2' | 'high3';

// 과목 타입 (고2, 고3용)
export type SubjectType = 'language_media' | 'speech_writing';

// 영역 타입
export type AreaType = 
  | 'reading_theory' // 화작(중3/고1) / 독서론(고2/고3)
  | 'grammar' // 문법(중3/고1만)
  | 'reading' // 독서/비문학
  | 'literature' // 문학
  | 'language_media' // 언어와매체 (고2/고3만)
  | 'speech_writing' // 화법과작문 (고2/고3만)
  | 'overall' // 전반적 영역
  | 'none'; // 따로없음

// 학생 정보
export interface Student {
  name: string;
  gradeLevel: GradeLevel;
  examWeek: string; // "2025년 10월 1주차"
  subjectType?: SubjectType; // 고2, 고3만 필수
  score: number;
  grade: number | string;
  mainWrongAreas: AreaType[]; // 주요 오답영역 (중복 선택 가능)
  wrongAnswers: {
    reading_theory?: number[]; // 화작(중3/고1) / 독서론(고2/고3) 오답번호
    grammar?: number[]; // 문법 오답번호 (중3/고1만)
    reading?: number[]; // 독서/비문학 오답번호
    literature?: number[]; // 문학 오답번호
    language_media?: number[]; // 언어와매체 (고2/고3만)
    speech_writing?: number[]; // 화법과작문 (고2/고3만)
  };
  additionalFeedback: string; // 추가 피드백
}

// 해설 아이템
export interface ExplanationItem {
  questionNumber: number;
  area: AreaType;
  explanation: string;
}

// 시험 설정
export interface ExamConfig {
  gradeLevel: GradeLevel;
  subjectType?: SubjectType; // 고2, 고3만
  examWeek: string;
  isHard: boolean; // 난이도 어려움 체크
  gradeCuts: {
    grade1: number;
    grade2: number;
    grade3: number;
    grade4: number;
  };
  explanations: {
    reading_theory: ExplanationItem[];
    grammar?: ExplanationItem[]; // 중3/고1만
    reading: ExplanationItem[];
    literature: ExplanationItem[];
    language_media?: ExplanationItem[]; // 고2/고3만
    speech_writing?: ExplanationItem[]; // 고2/고3만
  };
}

// 전체 관리자 설정
export interface AdminSettings {
  middle3_high1: {
    [examWeek: string]: ExamConfig;
  };
  high2: {
    language_media: {
      [examWeek: string]: ExamConfig;
    };
    speech_writing: {
      [examWeek: string]: ExamConfig;
    };
  };
  high3: {
    language_media: {
      [examWeek: string]: ExamConfig;
    };
    speech_writing: {
      [examWeek: string]: ExamConfig;
    };
  };
}

// 주차 정보
export interface WeekInfo {
  year: number;
  month: number;
  week: number;
  display: string; // "2025년 10월 1주차"
}

// 피드백 완료 기록
export interface FeedbackRecord {
  id: string; // 고유 ID
  studentData: Student; // 학생 전체 정보
  timestamp: number; // 복사한 시간
  date: string; // "2025-10-05" 형식
}

// 문자 템플릿 설정
export interface MessageTemplate {
  closing: string; // 총평 문구
  hardExamPhrase: string; // 어려운 시험일 때 문구
  normalExamPhrase: string; // 보통 시험일 때 문구
  endingMessage: string; // 마무리 문구
}
