import { useState, useEffect, useRef } from "react";
import { MessageForm } from "./components/MessageForm";
import { MessagePreview } from "./components/MessagePreview";
import {
  AdminPanel,
  AdminPanelRef,
} from "./components/AdminPanel";
import { TodayFeedbackList } from "./components/TodayFeedbackList";
import { HowToUseDialog } from "./components/HowToUseDialog";
import { WeeklyGradeCutSetup } from "./components/WeeklyGradeCutSetup";
import { Toaster } from "./components/ui/sonner";
import { Alert, AlertDescription } from "./components/ui/alert";
import {
  BookOpen,
  FileText,
  AlertCircle,
  Plus,
  AlertTriangle,
  Instagram,
  Mail,
} from "lucide-react";
import {
  Student,
  AdminSettings,
  ExamConfig,
  ExplanationItem,
  GradeLevel,
  SubjectType,
  AreaType,
} from "./types";
import { toast } from "sonner@2.0.3";
import { generateMessage } from "./utils/messageGenerator";
import {
  loadAdminSettings,
  saveAdminSettings,
  getExamConfig,
  cleanupOldFeedbackRecords,
  checkAndResetDailyRecords,
  loadMessageTemplate,
  saveMessageTemplate,
  checkCurrentWeekGradeCutsSet,
  createDefaultExamConfig,
} from "./utils/localStorage";
import { getCurrentWeekInfo } from "./utils/weekCalculator";
import { MessageTemplate } from "./types";

export default function App() {
  const adminPanelRef = useRef<AdminPanelRef>(null);
  const [adminSettings, setAdminSettings] =
    useState<AdminSettings>(loadAdminSettings());
  const [student, setStudent] = useState<Student>({
    name: "",
    gradeLevel: "middle3_high1",
    examWeek: getCurrentWeekInfo().display,
    score: 0,
    grade: "등급 없음",
    mainWrongAreas: [],
    wrongAnswers: {},
    additionalFeedback: "",
  });
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [feedbackListKey, setFeedbackListKey] = useState(0);
  const [messageTemplate, setMessageTemplate] =
    useState<MessageTemplate>(loadMessageTemplate());
  const [formKey, setFormKey] = useState(0);
  const [showWeeklySetup, setShowWeeklySetup] = useState(false);
  const [hasCheckedWeeklySetup, setHasCheckedWeeklySetup] =
    useState(false);

  // 앱 시작 시 오래된 피드백 기록 정리 및 자정 체크
  useEffect(() => {
    cleanupOldFeedbackRecords(30);
    checkAndResetDailyRecords();

    // 매 분마다 자정 체크
    const interval = setInterval(() => {
      checkAndResetDailyRecords();
      setFeedbackListKey((prev) => prev + 1); // 자정이 지나면 리스트 새로고침
    }, 60000); // 1분마다

    return () => clearInterval(interval);
  }, []);

  // 앱 시작 시 이번 주 등급컷이 모두 설정되었는지 확인
  useEffect(() => {
    if (!hasCheckedWeeklySetup) {
      const currentWeek = getCurrentWeekInfo().display;
      const allGradeCutsSet = checkCurrentWeekGradeCutsSet(
        adminSettings,
        currentWeek,
      );

      if (!allGradeCutsSet) {
        setShowWeeklySetup(true);
      }
      setHasCheckedWeeklySetup(true);
    }
  }, [adminSettings, hasCheckedWeeklySetup]);

  // 현재 학생의 시험 설정 가져오기
  const currentExamConfig: ExamConfig | null = getExamConfig(
    adminSettings,
    student.gradeLevel,
    student.examWeek,
    student.subjectType,
  );

  // 모든 해설 수집
  const getAllExplanations = (): ExplanationItem[] => {
    if (!currentExamConfig) return [];

    const allExplanations: ExplanationItem[] = [];
    Object.entries(currentExamConfig.explanations).forEach(
      ([area, explanations]) => {
        if (explanations) {
          allExplanations.push(...explanations);
        }
      },
    );
    return allExplanations;
  };

  // 학생 정보가 변경될 때마다 문자 자동 생성
  useEffect(() => {
    if (
      student.name &&
      student.score > 0 &&
      currentExamConfig
    ) {
      const allExplanations = getAllExplanations();
      const message = generateMessage(
        student,
        currentExamConfig.isHard,
        allExplanations,
        messageTemplate,
      );
      setGeneratedMessage(message);
    } else {
      setGeneratedMessage("");
    }
  }, [student, currentExamConfig, messageTemplate]);

  // 관리자 설정이 변경될 때마다 localStorage에 저장
  useEffect(() => {
    saveAdminSettings(adminSettings);
  }, [adminSettings]);

  const handleWeeklyGradeCutsComplete = (data: {
    high1: {
      grade1: number;
      grade2: number;
      grade3: number;
      grade4: number;
    };
    high2_language_media: {
      grade1: number;
      grade2: number;
      grade3: number;
      grade4: number;
    };
    high2_speech_writing: {
      grade1: number;
      grade2: number;
      grade3: number;
      grade4: number;
    };
    high3_language_media: {
      grade1: number;
      grade2: number;
      grade3: number;
      grade4: number;
    };
    high3_speech_writing: {
      grade1: number;
      grade2: number;
      grade3: number;
      grade4: number;
    };
  }) => {
    const currentWeek = getCurrentWeekInfo().display;
    const newSettings = JSON.parse(
      JSON.stringify(adminSettings),
    ) as AdminSettings;

    // 고1 (중3/고1) 등급컷 저장
    if (!newSettings.middle3_high1[currentWeek]) {
      newSettings.middle3_high1[currentWeek] =
        createDefaultExamConfig("middle3_high1", currentWeek);
    }
    newSettings.middle3_high1[currentWeek].gradeCuts =
      data.high1;

    // 고2 언어와매체 등급컷 저장
    if (!newSettings.high2.language_media[currentWeek]) {
      newSettings.high2.language_media[currentWeek] =
        createDefaultExamConfig(
          "high2",
          currentWeek,
          "language_media",
        );
    }
    newSettings.high2.language_media[currentWeek].gradeCuts =
      data.high2_language_media;

    // 고2 화법과작문 등급컷 저장
    if (!newSettings.high2.speech_writing[currentWeek]) {
      newSettings.high2.speech_writing[currentWeek] =
        createDefaultExamConfig(
          "high2",
          currentWeek,
          "speech_writing",
        );
    }
    newSettings.high2.speech_writing[currentWeek].gradeCuts =
      data.high2_speech_writing;

    // 고3 언어와매체 등급컷 저장
    if (!newSettings.high3.language_media[currentWeek]) {
      newSettings.high3.language_media[currentWeek] =
        createDefaultExamConfig(
          "high3",
          currentWeek,
          "language_media",
        );
    }
    newSettings.high3.language_media[currentWeek].gradeCuts =
      data.high3_language_media;

    // 고3 화법과작문 등급컷 저장
    if (!newSettings.high3.speech_writing[currentWeek]) {
      newSettings.high3.speech_writing[currentWeek] =
        createDefaultExamConfig(
          "high3",
          currentWeek,
          "speech_writing",
        );
    }
    newSettings.high3.speech_writing[currentWeek].gradeCuts =
      data.high3_speech_writing;

    setAdminSettings(newSettings);
    saveAdminSettings(newSettings);
    setShowWeeklySetup(false);
  };

  const handleWeeklySetupSkip = () => {
    setShowWeeklySetup(false);
  };

  const handleCopySuccess = () => {
    // 피드백 리스트 새로고침
    setFeedbackListKey((prev) => prev + 1);
  };

  const handleStudentSelect = (selectedStudent: Student) => {
    setStudent(selectedStudent);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 새 문자 생성 - 입력 폼 초기화
  const handleNewMessage = () => {
    setStudent({
      name: "",
      gradeLevel: "middle3_high1",
      examWeek: getCurrentWeekInfo().display,
      score: 0,
      grade: "등급 없음",
      mainWrongAreas: [],
      wrongAnswers: {},
      additionalFeedback: "",
    });
    setGeneratedMessage("");
    setFormKey((prev) => prev + 1); // 폼 컴포넌트 리마운트하여 완전 초기화
    toast.success("새 문자 작성을 시작합니다.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 해설 자동 저장
  const handleExplanationSave = (
    area: AreaType,
    questionNumber: number,
    explanation: string,
  ) => {
    const newSettings = JSON.parse(
      JSON.stringify(adminSettings),
    );

    // 고2/고3에서 1~34번 문제는 양쪽 과목에 모두 저장
    const isSharedQuestion =
      (student.gradeLevel === "high2" ||
        student.gradeLevel === "high3") &&
      questionNumber >= 1 &&
      questionNumber <= 34;

    if (student.gradeLevel === "middle3_high1") {
      // 중3/고1 처리
      if (!newSettings.middle3_high1[student.examWeek]) {
        newSettings.middle3_high1[student.examWeek] =
          createDefaultExamConfig(
            student.gradeLevel,
            student.examWeek,
          );
      }
      saveExplanationToConfig(
        newSettings.middle3_high1[student.examWeek],
        area,
        questionNumber,
        explanation,
      );
    } else if (
      (student.gradeLevel === "high2" ||
        student.gradeLevel === "high3") &&
      student.subjectType
    ) {
      // 고2/고3 처리
      const gradeSettings =
        student.gradeLevel === "high2"
          ? newSettings.high2
          : newSettings.high3;

      if (isSharedQuestion) {
        // 1~34번: 양쪽 과목에 모두 저장
        ["language_media", "speech_writing"].forEach(
          (subjectType) => {
            if (!gradeSettings[subjectType][student.examWeek]) {
              gradeSettings[subjectType][student.examWeek] =
                createDefaultExamConfig(
                  student.gradeLevel,
                  student.examWeek,
                  subjectType as SubjectType,
                );
            }
            saveExplanationToConfig(
              gradeSettings[subjectType][student.examWeek],
              area,
              questionNumber,
              explanation,
            );
          },
        );
      } else {
        // 35~45번: 현재 선택된 과목에만 저장
        if (
          !gradeSettings[student.subjectType][student.examWeek]
        ) {
          gradeSettings[student.subjectType][student.examWeek] =
            createDefaultExamConfig(
              student.gradeLevel,
              student.examWeek,
              student.subjectType,
            );
        }
        saveExplanationToConfig(
          gradeSettings[student.subjectType][student.examWeek],
          area,
          questionNumber,
          explanation,
        );
      }
    } else {
      return;
    }

    setAdminSettings(newSettings);
    const saveMessage = isSharedQuestion
      ? `${questionNumber}번 해설이 양쪽 과목에 저장되었습니다.`
      : `${questionNumber}번 해설이 저장되었습니다.`;
    toast.success(saveMessage);
  };

  // 설정에 해설 저장하는 헬퍼 함수
  const saveExplanationToConfig = (
    config: ExamConfig,
    area: AreaType,
    questionNumber: number,
    explanation: string,
  ) => {
    if (!config.explanations[area]) {
      config.explanations[area] = [];
    }

    const explanations = config.explanations[
      area
    ] as ExplanationItem[];
    const existingIndex = explanations.findIndex(
      (e) => e.questionNumber === questionNumber,
    );

    if (existingIndex >= 0) {
      explanations[existingIndex].explanation = explanation;
    } else {
      explanations.push({ questionNumber, area, explanation });
    }
  };

  // 시험 난이도 변경
  const handleIsHardChange = (isHard: boolean) => {
    if (!currentExamConfig) return;

    const newSettings = JSON.parse(JSON.stringify(adminSettings));
    
    if (student.gradeLevel === "middle3_high1") {
      if (!newSettings.middle3_high1[student.examWeek]) {
        newSettings.middle3_high1[student.examWeek] = createDefaultExamConfig(
          student.gradeLevel,
          student.examWeek,
        );
      }
      newSettings.middle3_high1[student.examWeek].isHard = isHard;
    } else if (
      (student.gradeLevel === "high2" || student.gradeLevel === "high3") &&
      student.subjectType
    ) {
      const gradeSettings =
        student.gradeLevel === "high2" ? newSettings.high2 : newSettings.high3;

      if (!gradeSettings[student.subjectType][student.examWeek]) {
        gradeSettings[student.subjectType][student.examWeek] =
          createDefaultExamConfig(
            student.gradeLevel,
            student.examWeek,
            student.subjectType,
          );
      }
      gradeSettings[student.subjectType][student.examWeek].isHard = isHard;
    }

    setAdminSettings(newSettings);
    toast.success(isHard ? "어려운 시험으로 설정되었습니다." : "보통 난이도로 설정되었습니다.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />

      {/* 이번 주 등급컷 일괄 설정 */}
      <WeeklyGradeCutSetup
        open={showWeeklySetup}
        currentWeek={getCurrentWeekInfo().display}
        onComplete={handleWeeklyGradeCutsComplete}
        onSkip={handleWeeklySetupSkip}
      />

      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 px-4 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary-foreground/10 p-2 rounded-lg">
                <BookOpen className="h-8 w-8" />
              </div>
              <div>
                <h1>
                  피드백 문자 생성기
                </h1>
                <p className="text-sm opacity-80 mt-1">
                  대치동강용덕국어논술학원
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HowToUseDialog />
              <AdminPanel
                ref={adminPanelRef}
                settings={adminSettings}
                onSettingsChange={setAdminSettings}
                messageTemplate={messageTemplate}
                onTemplateChange={(template) => {
                  setMessageTemplate(template);
                  saveMessageTemplate(template);
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Notice Banner */}
      <div className="bg-primary/5 border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Alert className="border-primary/30 bg-primary/5">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <AlertDescription className="ml-2 flex items-center justify-between gap-4">
              <span>
                모든 작업은 등급컷 설정 이후에 가능합니다. 해당 시험의 등급컷을 저장했는지 먼저 확인하세요.
              </span>
              <button
                onClick={() => adminPanelRef.current?.open()}
                className="text-primary hover:underline whitespace-nowrap text-sm"
              >
                설정 →
              </button>
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Input Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-primary">학생 정보 입력</h2>
              </div>
              <button
                onClick={handleNewMessage}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />새 문자
                생성하기(초기화)
              </button>
            </div>
            <MessageForm
              key={formKey}
              student={student}
              onStudentChange={setStudent}
              examConfig={currentExamConfig}
              onExplanationSave={handleExplanationSave}
              onIsHardChange={handleIsHardChange}
            />
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <div className="lg:sticky lg:top-6 space-y-4">
              <MessagePreview
                message={generatedMessage}
                studentData={student}
                onCopySuccess={handleCopySuccess}
              />

              {/* Today's Feedback List */}
              <TodayFeedbackList
                key={feedbackListKey}
                onStudentSelect={handleStudentSelect}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm">제작자: 김지후</span>
              <a
                href="https://www.instagram.com/k.jhxx/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white hover:opacity-90 transition-opacity"
                aria-label="인스타그램으로 이동"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="mailto:enwol0129@gmail.com"
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="이메일로 문의하기"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}