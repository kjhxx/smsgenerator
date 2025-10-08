import { ExplanationItem, MessageTemplate } from '../types';

// 고3 화작/언매 오답 해설 데이터 (엑셀 시트 데이터 구조)
export const mockExplanations: ExplanationItem[] = [
  { questionNumber: '1', category: '언어', explanation: '음운의 변동 과정에서 교체와 탈락을 구분해야 합니다.' },
  { questionNumber: '2', category: '언어', explanation: '된소리되기의 조건을 정확히 이해해야 합니다.' },
  { questionNumber: '3', category: '언어', explanation: '문법 요소의 의미를 파악하는 문제입니다.' },
  { questionNumber: '4', category: '매체', explanation: '매체 자료의 특성과 표현 방법을 분석해야 합니다.' },
  { questionNumber: '5', category: '매체', explanation: '복합 양식 자료의 수용과 생산 과정을 이해해야 합니다.' },
  { questionNumber: '6', category: '독서-인문', explanation: '글의 핵심 논지를 파악하고 세부 내용을 정확히 이해해야 합니다.' },
  { questionNumber: '7', category: '독서-인문', explanation: '논증 구조를 분석하고 논리적 관계를 파악해야 합니다.' },
  { questionNumber: '8', category: '독서-사회', explanation: '경제 개념과 원리를 정확히 이해해야 합니다.' },
  { questionNumber: '9', category: '독서-사회', explanation: '구체적 사례에 원리를 적용하는 능력이 필요합니다.' },
  { questionNumber: '10', category: '독서-과학', explanation: '과학적 원리와 과정을 체계적으로 이해해야 합니다.' },
  { questionNumber: '11', category: '독서-과학', explanation: '실험 결과를 해석하고 추론하는 능력이 필요합니다.' },
  { questionNumber: '12', category: '독서-기술', explanation: '기술의 원리와 작동 방식을 이해해야 합니다.' },
  { questionNumber: '13', category: '독서-예술', explanation: '예술 작품의 특징과 표현 기법을 분석해야 합니다.' },
  { questionNumber: '14', category: '문학-현대시', explanation: '시적 화자의 정서와 태도를 파악해야 합니다.' },
  { questionNumber: '15', category: '문학-현대시', explanation: '시어와 시구의 의미를 맥락에 맞게 해석해야 합니다.' },
  { questionNumber: '16', category: '문학-고전시가', explanation: '고전 시가의 주제와 표현 방법을 이해해야 합니다.' },
  { questionNumber: '17', category: '문학-고전시가', explanation: '시대적 배경과 문화적 맥락을 고려해야 합니다.' },
  { questionNumber: '18', category: '문학-현대소설', explanation: '인물의 심리와 갈등 구조를 분석해야 합니다.' },
  { questionNumber: '19', category: '문학-현대소설', explanation: '서술 방식과 표현 기법의 효과를 파악해야 합니다.' },
  { questionNumber: '20', category: '문학-고전소설', explanation: '고전 소설의 서사 구조를 이해해야 합니다.' },
  { questionNumber: '21', category: '문학-극/수필', explanation: '갈래의 특성에 맞는 감상이 필요합니다.' },
  { questionNumber: '22', category: '독서-융합', explanation: '여러 분야의 지식을 통합적으로 이해해야 합니다.' },
  { questionNumber: '23', category: '독서-융합', explanation: '복합적 사고와 추론 능력이 필요합니다.' },
];

// 문자 템플릿
export const messageTemplates: Record<string, MessageTemplate> = {
  default: {
    greeting: '안녕하세요. 대치동 강용덕 국어논술학원입니다.',
    closing: '앞으로도 열심히 노력하겠습니다. 감사합니다.',
    encouragement: '꾸준한 노력으로 반드시 좋은 결과를 얻을 수 있습니다.',
  },
  formal: {
    greeting: '학부모님께 안녕하십니까. 대치동 강용덕 국어논술학원입니다.',
    closing: '항상 최선을 다하여 지도하겠습니다. 감사합니다.',
    encouragement: '체계적인 학습 관리를 통해 목표 달성을 지원하겠습니다.',
  },
  friendly: {
    greeting: '안녕하세요! 강용덕 국어논술학원입니다 :)',
    closing: '다음에도 더 좋은 소식 전해드리겠습니다!',
    encouragement: '이번 경험을 발판 삼아 더 성장할 수 있을 거예요!',
  },
};

// 주차별 시험명 데이터
export const examWeeks = [
  '10월 1주차',
  '10월 2주차',
  '10월 3주차',
  '10월 4주차',
  '11월 1주차',
  '11월 2주차',
  '11월 3주차',
  '11월 4주차',
];
