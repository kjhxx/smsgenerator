import { ExamConfig } from '../types';

type GradeCuts = NonNullable<ExamConfig['gradeCuts']>;

function normalizeGradeCuts(cuts?: ExamConfig['gradeCuts']): GradeCuts {
  return {
    grade1: Number.isFinite(Number(cuts?.grade1)) ? Number(cuts!.grade1) : 0,
    grade2: Number.isFinite(Number(cuts?.grade2)) ? Number(cuts!.grade2) : 0,
    grade3: Number.isFinite(Number(cuts?.grade3)) ? Number(cuts!.grade3) : 0,
    grade4: Number.isFinite(Number(cuts?.grade4)) ? Number(cuts!.grade4) : 0,
  };
}

// 등급 계산 (등급컷 기반)
export function calculateGrade(
  score: number,
  gradeCutsInput: ExamConfig['gradeCuts']
): number | string {
  const gradeCuts = normalizeGradeCuts(gradeCutsInput);
  const { grade1, grade2, grade3, grade4 } = gradeCuts;

  // 등급컷이 설정되지 않은 경우 (모두 0 또는 미입력/NaN)
  if ([grade1, grade2, grade3, grade4].every(v => v === 0)) {
    return '등급컷 등록 필요';
  }

  if (score >= grade1) return 1;
  if (score >= grade2) return 2;
  if (score >= grade3) return 3;
  if (score >= grade4) return 4;
  return '등급 없음';
}

// 등급 표시 텍스트 (4등급 초과는 표시 안함)
export function getGradeDisplayText(score: number, grade: number | string): string {
  if (grade === '등급컷 등록 필요') return `${score}점 (등급컷 등록 필요)`;
  if (grade === '등급 없음' || typeof grade !== 'number' || grade > 4) return `${score}점`;
  return `${score}점 (${grade}등급)`;
}

// 기본 등급컷 (관리자가 설정 안했을 때)
export function getDefaultGradeCuts(): ExamConfig['gradeCuts'] {
  return { grade1: 0, grade2: 0, grade3: 0, grade4: 0 };
}

