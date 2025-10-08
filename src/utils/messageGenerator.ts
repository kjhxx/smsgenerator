import { Student, ExplanationItem, AreaType, GradeLevel, SubjectType, MessageTemplate } from '../types';
import { getGradeDisplayText } from './gradeCalculator';
import { isPreviousWeek } from './weekCalculator';

// 영역명 한글 변환 (학년별)
const getAreaName = (area: AreaType, gradeLevel: GradeLevel): string => {
  // 중3/고1 전용 라벨
  if (gradeLevel === 'middle3_high1') {
    const middle3High1Names: Record<AreaType, string> = {
      reading_theory: '화작',
      grammar: '문법',
      reading: '독서',
      literature: '문학',
      language_media: '언어와매체',
      speech_writing: '화법과작문',
      overall: '전반적 영역',
      none: '따로없음'
    };
    return middle3High1Names[area];
  }
  
  // 고2/고3 라벨
  const defaultNames: Record<AreaType, string> = {
    reading_theory: '독서론',
    grammar: '어법',
    reading: '독서',
    literature: '문학',
    language_media: '언어와매체',
    speech_writing: '화법과작문',
    overall: '전반적 영역',
    none: '따로없음'
  };
  return defaultNames[area];
};

// 과목명 한글 변환
const SUBJECT_NAMES: Record<SubjectType, string> = {
  language_media: '언어와매체',
  speech_writing: '화법과작문'
};

// 학년명 한글 변환
const GRADE_NAMES: Record<GradeLevel, string> = {
  middle3_high1: '중3/고1',
  high2: '고2',
  high3: '고3'
};

// 성을 제외한 이름 추출
function getFirstName(fullName: string): string {
  if (fullName.length <= 2) return fullName;
  return fullName.substring(1);
}

// (이)는 조사 선택
function getTopicParticle(name: string): string {
  if (!name) return '이는';
  const lastChar = name[name.length - 1];
  const code = lastChar.charCodeAt(0) - 0xAC00;
  const hasJongseong = code % 28 !== 0;
  return hasJongseong ? '이는' : '는';
}

// 오답 해설 생성
function generateExplanationText(
  wrongNumbers: number[],
  area: AreaType,
  explanations: ExplanationItem[],
  gradeLevel: GradeLevel
): string {
  if (!wrongNumbers || wrongNumbers.length === 0) return '';
  
  const areaExplanations = explanations.filter(exp => exp.area === area);
  const matched = wrongNumbers
    .map((num, index) => {
      const exp = areaExplanations.find(e => e.questionNumber === num);
      if (!exp) return null;
      // 첫 번째 문항에만 영역명 표시
      if (index === 0) {
        return `(${getAreaName(area, gradeLevel)}) ${num}. ${exp.explanation}`;
      } else {
        return `${num}. ${exp.explanation}`;
      }
    })
    .filter(Boolean);
  
  return matched.join(' ');
}

// 피드백 섹션 생성
function generateFeedbackSection(
  student: Student,
  allExplanations: ExplanationItem[]
): string {
  const { wrongAnswers, gradeLevel } = student;
  const feedbackParts: string[] = [];
  
  // 중3/고1 영역
  if (gradeLevel === 'middle3_high1') {
    if (wrongAnswers.reading_theory?.length) {
      feedbackParts.push(generateExplanationText(wrongAnswers.reading_theory, 'reading_theory', allExplanations, gradeLevel));
    }
    if (wrongAnswers.grammar?.length) {
      feedbackParts.push(generateExplanationText(wrongAnswers.grammar, 'grammar', allExplanations, gradeLevel));
    }
    if (wrongAnswers.reading?.length) {
      feedbackParts.push(generateExplanationText(wrongAnswers.reading, 'reading', allExplanations, gradeLevel));
    }
    if (wrongAnswers.literature?.length) {
      feedbackParts.push(generateExplanationText(wrongAnswers.literature, 'literature', allExplanations, gradeLevel));
    }
  } else {
    // 고2/고3 영역
    if (wrongAnswers.reading_theory?.length) {
      feedbackParts.push(generateExplanationText(wrongAnswers.reading_theory, 'reading_theory', allExplanations, gradeLevel));
    }
    if (wrongAnswers.reading?.length) {
      feedbackParts.push(generateExplanationText(wrongAnswers.reading, 'reading', allExplanations, gradeLevel));
    }
    if (wrongAnswers.literature?.length) {
      feedbackParts.push(generateExplanationText(wrongAnswers.literature, 'literature', allExplanations, gradeLevel));
    }
    if (wrongAnswers.language_media?.length) {
      feedbackParts.push(generateExplanationText(wrongAnswers.language_media, 'language_media', allExplanations, gradeLevel));
    }
    if (wrongAnswers.speech_writing?.length) {
      feedbackParts.push(generateExplanationText(wrongAnswers.speech_writing, 'speech_writing', allExplanations, gradeLevel));
    }
  }
  
  if (feedbackParts.length === 0) {
    return '스스로 모든 오답을 정확하게 고쳐주었고, 따로 질문이 없어 피드백은 진행하지 않았습니다.';
  }
  
  return `오늘 피드백을 진행한 부분입니다. ${feedbackParts.join(' ')}`;
}

// 주요 오답 영역 텍스트 생성
function getMainWrongAreasText(areas: AreaType[], gradeLevel: GradeLevel): string {
  if (areas.length === 0 || (areas.length === 1 && areas[0] === 'none')) {
    return '따로없음';
  }
  return areas.map(area => getAreaName(area, gradeLevel)).join(', ');
}

// 최종 문자 생성
export function generateMessage(
  student: Student,
  isHard: boolean,
  allExplanations: ExplanationItem[],
  template: MessageTemplate
): string {
  const firstName = getFirstName(student.name);
  const particle = getTopicParticle(firstName);
  
  // 시험명 생성 - (이번주) 제거
  let examName = student.examWeek.replace(' (이번주)', '');
  examName += ` ${GRADE_NAMES[student.gradeLevel]} 문제지`;
  if (student.subjectType) {
    examName += ` (${SUBJECT_NAMES[student.subjectType]})`;
  }
  
  // 점수 및 등급
  const scoreGradeText = getGradeDisplayText(student.score, student.grade);
  
  // 주요 오답 영역
  const mainAreasText = getMainWrongAreasText(student.mainWrongAreas, student.gradeLevel);
  
  // 피드백 내용
  const feedbackText = generateFeedbackSection(student, allExplanations);
  
  // 추가 피드백
  const additionalFeedback = student.additionalFeedback 
    ? `${student.additionalFeedback} ` 
    : '';
  
  // 난이도 멘트
  const difficultyPhrase = isHard ? template.hardExamPhrase : template.normalExamPhrase;
  const difficultyText = difficultyPhrase ? `${difficultyPhrase} ` : '';
  
  // 저번주 체크
  const isPastWeek = isPreviousWeek(student.examWeek);
  const pastWeekText = isPastWeek ? '지난 모의고사이지만 오늘 피드백을 진행했습니다. ' : '';
  
  // 템플릿 변수 치환
  // {firstName}을 이름으로 치환하고, (이)는 패턴을 적절한 조사로 치환
  let closingText = template.closing.replace(/\{firstName\}/g, firstName);
  
  // (이)는 패턴을 받침에 맞게 치환
  closingText = closingText.replace(/\(이\)는/g, particle);
  
  // 최종 문자 조합
  const message = `안녕하세요, 대치동강용덕국어논술학원입니다.
1. 이름: ${student.name}
2. 시험명: ${examName}
3. 점수(등급): ${scoreGradeText}
4. 피드백 내용: 이번 모의고사의 주요 오답 영역은 ${mainAreasText}입니다. ${feedbackText}
5. 총평: ${pastWeekText}${difficultyText}${closingText} ${additionalFeedback}${template.endingMessage}`;
  
  return message;
}
