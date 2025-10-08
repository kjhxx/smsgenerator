import { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Student, GradeLevel, SubjectType, AreaType, ExamConfig, ExplanationItem } from '../types';
import { calculateGrade } from '../utils/gradeCalculator';
import { getAvailableWeeks } from '../utils/weekCalculator';
import { Plus, X } from 'lucide-react';

interface MessageFormProps {
  student: Student;
  onStudentChange: (student: Student) => void;
  examConfig: ExamConfig | null;
  onExplanationSave: (area: AreaType, questionNumber: number, explanation: string) => void;
  onIsHardChange?: (isHard: boolean) => void;
}

const getAreaLabel = (area: AreaType, gradeLevel: GradeLevel): string => {
  if (gradeLevel === 'middle3_high1') {
    const middle3High1Labels: Record<AreaType, string> = {
      reading_theory: '화작',
      grammar: '문법',
      reading: '독서',
      literature: '문학',
      language_media: '언어와매체',
      speech_writing: '화법과작문',
      overall: '전반적 영역',
      none: '따로없음'
    };
    return middle3High1Labels[area];
  }
  const defaultLabels: Record<AreaType, string> = {
    reading_theory: '독서론',
    grammar: '어법',
    reading: '독서',
    literature: '문학',
    language_media: '언어와매체',
    speech_writing: '화법과작문',
    overall: '전반적 영역',
    none: '따로없음'
  };
  return defaultLabels[area];
};

const getAreaLabelWithRange = (area: AreaType, gradeLevel: GradeLevel): string => {
  const baseLabel = getAreaLabel(area, gradeLevel);
  if (gradeLevel === 'high2' || gradeLevel === 'high3') {
    switch (area) {
      case 'reading_theory':
        return `${baseLabel} (1~3번)`;
      case 'reading':
        return `${baseLabel} (4~17번)`;
      case 'literature':
        return `${baseLabel} (18~34번)`;
      case 'language_media':
        return `${baseLabel} (35~45번)`;
      case 'speech_writing':
        return `${baseLabel} (35~45번)`;
      default:
        return baseLabel;
    }
  }
  return baseLabel;
};

interface QuestionRow {
  questionNumber: number | '';
  explanation: string;
}

export function MessageForm({ student, onStudentChange, examConfig, onExplanationSave, onIsHardChange }: MessageFormProps) {
  const availableWeeks = getAvailableWeeks();

  // examWeek은 availableWeeks가 준비된 후에만 기본값을 세팅
  const [localStudent, setLocalStudent] = useState<Student>({
    ...student,
    examWeek: student.examWeek || '',
  });

  const [questionRows, setQuestionRows] = useState<Record<AreaType, QuestionRow[]>>({
    reading_theory: [],
    grammar: [],
    reading: [],
    literature: [],
    language_media: [],
    speech_writing: [],
    overall: [],
    none: []
  });

  // availableWeeks가 준비되고, examWeek이 없거나 유효하지 않으면 이번주로 설정
  useEffect(() => {
    if (
      availableWeeks.length > 0 &&
      (!localStudent.examWeek || !availableWeeks.some(w => w.display === localStudent.examWeek))
    ) {
      setLocalStudent(prev => ({
        ...prev,
        examWeek: availableWeeks[0].display,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableWeeks]);

  useEffect(() => {
    if (examConfig && localStudent.score > 0) {
      const grade = calculateGrade(localStudent.score, examConfig.gradeCuts);
      setLocalStudent(prev => ({ ...prev, grade }));
    }
  }, [localStudent.score, examConfig]);

  useEffect(() => {
    onStudentChange(localStudent);
  }, [localStudent, onStudentChange]);

  const handleInputChange = (field: keyof Student, value: any) => {
    setLocalStudent(prev => ({ ...prev, [field]: value }));
  };

  const handleGradeLevelChange = (gradeLevel: GradeLevel) => {
    setLocalStudent(prev => ({
      ...prev,
      gradeLevel,
      subjectType: undefined,
      mainWrongAreas: [],
      wrongAnswers: {}
    }));
  };

  const handleMainWrongAreaToggle = (area: AreaType) => {
    setLocalStudent(prev => {
      const current = prev.mainWrongAreas || [];
      const isSelected = current.includes(area);
      return {
        ...prev,
        mainWrongAreas: isSelected
          ? current.filter(a => a !== area)
          : [...current, area]
      };
    });
  };

  const getExplanationForQuestion = (area: AreaType, questionNumber: number): string => {
    if (!examConfig) return '';
    const explanations = examConfig.explanations[area];
    if (!explanations) return '';
    const found = explanations.find(e => e.questionNumber === questionNumber);
    return found ? found.explanation : '';
  };

  const addQuestionRow = (area: AreaType) => {
    setQuestionRows(prev => ({
      ...prev,
      [area]: [...prev[area], { questionNumber: '', explanation: '' }]
    }));
  };

  const removeQuestionRow = (area: AreaType, index: number) => {
    setQuestionRows(prev => {
      const newRows = [...prev[area]];
      newRows.splice(index, 1);
      return { ...prev, [area]: newRows };
    });
    updateWrongAnswers(area);
  };

  const handleQuestionNumberChange = (area: AreaType, index: number, value: string) => {
    const num = parseInt(value);
    const isValid = !isNaN(num) && num >= 1 && num <= 45;
    setQuestionRows(prev => {
      const newRows = [...prev[area]];
      newRows[index] = {
        ...newRows[index],
        questionNumber: value === '' ? '' : (isValid ? num : newRows[index].questionNumber)
      };
      if (isValid) {
        const savedExplanation = getExplanationForQuestion(area, num);
        if (savedExplanation) {
          newRows[index].explanation = savedExplanation;
        }
      }
      return { ...prev, [area]: newRows };
    });
    if (isValid) {
      updateWrongAnswers(area);
    }
  };

  const handleExplanationChange = (area: AreaType, index: number, explanation: string) => {
    setQuestionRows(prev => {
      const newRows = [...prev[area]];
      newRows[index] = { ...newRows[index], explanation };
      return { ...prev, [area]: newRows };
    });
  };

  const handleExplanationBlur = (area: AreaType, index: number) => {
    const row = questionRows[area][index];
    if (row.questionNumber && row.explanation.trim()) {
      onExplanationSave(area, row.questionNumber as number, row.explanation.trim());
    }
  };

  const updateWrongAnswers = (area: AreaType) => {
    setTimeout(() => {
      setQuestionRows(current => {
        const numbers = current[area]
          .map(row => row.questionNumber)
          .filter(num => num !== '' && num >= 1 && num <= 45) as number[];
        setLocalStudent(prev => ({
          ...prev,
          wrongAnswers: {
            ...prev.wrongAnswers,
            [area]: numbers.length > 0 ? numbers : undefined
          }
        }));
        return current;
      });
    }, 0);
  };

  const getMainWrongAreaOptions = (): AreaType[] => {
    if (localStudent.gradeLevel === 'middle3_high1') {
      return ['reading_theory', 'grammar', 'reading', 'literature', 'overall', 'none'];
    }
    if (localStudent.gradeLevel === 'high2' || localStudent.gradeLevel === 'high3') {
      const baseAreas: AreaType[] = ['reading_theory', 'reading', 'literature'];
      if (localStudent.subjectType === 'language_media') {
        return [...baseAreas, 'language_media', 'overall', 'none'];
      } else if (localStudent.subjectType === 'speech_writing') {
        return [...baseAreas, 'speech_writing', 'overall', 'none'];
      }
      return ['reading_theory', 'reading', 'literature', 'language_media', 'speech_writing', 'overall', 'none'];
    }
    return ['reading_theory', 'reading', 'literature', 'language_media', 'speech_writing', 'overall', 'none'];
  };

  const getFeedbackAreas = (): AreaType[] => {
    if (localStudent.gradeLevel === 'middle3_high1') {
      return ['reading_theory', 'grammar', 'reading', 'literature'];
    }
    if (localStudent.gradeLevel === 'high2' || localStudent.gradeLevel === 'high3') {
      const baseAreas: AreaType[] = ['reading_theory', 'reading', 'literature'];
      if (localStudent.subjectType === 'language_media') {
        return [...baseAreas, 'language_media'];
      } else if (localStudent.subjectType === 'speech_writing') {
        return [...baseAreas, 'speech_writing'];
      }
      return ['reading_theory', 'reading', 'literature', 'language_media', 'speech_writing'];
    }
    return ['reading_theory', 'reading', 'literature', 'language_media', 'speech_writing'];
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-4">
        {/* 기본 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">학생 이름</Label>
            <Input
              id="name"
              placeholder="홍길동"
              value={localStudent.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gradeLevel">학년</Label>
            <Select
              value={localStudent.gradeLevel}
              onValueChange={(value) => handleGradeLevelChange(value as GradeLevel)}
            >
              <SelectTrigger>
                <SelectValue placeholder="학년 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="middle3_high1">중3/고1</SelectItem>
                <SelectItem value="high2">고2</SelectItem>
                <SelectItem value="high3">고3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* 시험 주차 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="examWeek">시험 주차</Label>
            <Select
              value={localStudent.examWeek}
              onValueChange={(value) => handleInputChange('examWeek', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="주차 선택" />
              </SelectTrigger>
              <SelectContent>
                {availableWeeks.map((week) => (
                  <SelectItem key={week.display} value={week.display}>
                    {week.display}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(localStudent.gradeLevel === 'high2' || localStudent.gradeLevel === 'high3') && (
            <div className="space-y-2">
              <Label htmlFor="subjectType">과목</Label>
              <Select
                value={localStudent.subjectType}
                onValueChange={(value) => handleInputChange('subjectType', value as SubjectType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="과목 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="language_media">언어와 매체</SelectItem>
                  <SelectItem value="speech_writing">화법과 작문</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        {/* 점수 및 등급 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="score">원점수</Label>
            <Input
              id="score"
              type="number"
              min="0"
              max="100"
              placeholder="85"
              value={localStudent.score || ''}
              onChange={(e) => handleInputChange('score', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>자동 계산된 등급</Label>
            <div className="flex h-9 w-full min-w-0 rounded-md border border-input px-3 py-1 bg-input-background">
              {localStudent.score > 0 && examConfig ? (
                <span className={localStudent.grade === '등급컷 등록 필요' ? 'text-destructive' : ''}>
                  {localStudent.grade === '등급컷 등록 필요'
                    ? '등급컷 등록 필요'
                    : localStudent.grade === '등급 없음'
                    ? '4등급 미만'
                    : `${localStudent.grade}등급`}
                </span>
              ) : (
                <span className="text-muted-foreground">점수를 입력하세요</span>
              )}
            </div>
          </div>
        </div>
        {/* 시험 난이도 */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isHard"
              checked={examConfig?.isHard || false}
              onCheckedChange={(checked) => {
                if (onIsHardChange) {
                  onIsHardChange(checked as boolean);
                }
              }}
            />
            <Label htmlFor="isHard" className="cursor-pointer">
              어려운 시험이었나요? (체크 시 총평에 격려멘트가 추가됩니다)
            </Label>
          </div>
        </div>
        {/* 주요 오답 영역 (중복 선택) */}
        <div className="space-y-3 pt-4 border-t">
          <Label>주요 오답 영역 (중복 선택 가능)</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {getMainWrongAreaOptions().map((area) => (
              <div key={area} className="flex items-center space-x-2">
                <Checkbox
                  id={`area-${area}`}
                  checked={localStudent.mainWrongAreas?.includes(area)}
                  onCheckedChange={() => handleMainWrongAreaToggle(area)}
                />
                <Label htmlFor={`area-${area}`} className="cursor-pointer">
                  {getAreaLabelWithRange(area, localStudent.gradeLevel)}
                </Label>
              </div>
            ))}
          </div>
        </div>
        {/* 영역별 오답 번호 및 해설 입력 */}
        <div className="space-y-6 pt-4 border-t">
          <div>
            <h3>영역별 오답 문제 번호 및 해설 (1-45번)</h3>
            <p className="text-sm text-muted-foreground mt-1">
              * 플러스 버튼으로 문제를 추가하고, 번호와 해설을 입력하세요. 해설은 자동으로 저장됩니다.
            </p>
          </div>
          {getFeedbackAreas().map((area) => (
            <Card key={area} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">{getAreaLabelWithRange(area, localStudent.gradeLevel)}</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    문제 번호를 입력하면 저장된 해설이 자동으로 불러와집니다.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addQuestionRow(area)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  문제 추가
                </Button>
              </div>
              {questionRows[area].length > 0 && (
                <div className="space-y-2 mt-4">
                  {questionRows[area].map((row, index) => {
                    const savedExplanation = row.questionNumber && typeof row.questionNumber === 'number'
                      ? getExplanationForQuestion(area, row.questionNumber)
                      : '';
                    return (
                      <div key={index} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="w-24 space-y-2">
                            <Label className="text-xs">번호</Label>
                            <Input
                              type="number"
                              min="1"
                              max="45"
                              placeholder="예: 6"
                              value={row.questionNumber === '' ? '' : row.questionNumber}
                              onChange={(e) => handleQuestionNumberChange(area, index, e.target.value)}
                              onBlur={() => updateWrongAnswers(area)}
                              className="text-center"
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">해설</Label>
                              {savedExplanation && row.explanation === savedExplanation && (
                                <Badge variant="secondary" className="text-xs">
                                  저장됨
                                </Badge>
                              )}
                            </div>
                            <Textarea
                              placeholder="문제 해설을 입력하세요 (자동 저장됩니다)"
                              rows={2}
                              value={row.explanation}
                              onChange={(e) => handleExplanationChange(area, index, e.target.value)}
                              onBlur={() => handleExplanationBlur(area, index)}
                              className="text-sm"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeQuestionRow(area, index)}
                            className="mt-6"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {questionRows[area].length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                  문제 추가 버튼을 눌러 피드백한 문제를 추가하세요
                </div>
              )}
            </Card>
          ))}
        </div>
        {/* 추가 피드백 */}
        <div className="space-y-2 pt-4 border-t">
          <Label htmlFor="additionalFeedback">추가 피드백 (선택사항)</Label>
          <Textarea
            id="additionalFeedback"
            placeholder="총평에 추가할 내용을 입력하세요"
            rows={3}
            value={localStudent.additionalFeedback}
            onChange={(e) => handleInputChange('additionalFeedback', e.target.value)}
          />
        </div>
      </div>
    </Card>
  );
}
