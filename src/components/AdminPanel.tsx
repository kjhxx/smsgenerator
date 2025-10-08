import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Settings, Trash2, Edit2 } from "lucide-react";
import {
  AdminSettings,
  ExamConfig,
  GradeLevel,
  SubjectType,
  MessageTemplate,
  AreaType,
  ExplanationItem,
} from "../types";
import { getAvailableWeeks } from "../utils/weekCalculator";
import { toast } from "sonner@2.0.3";
import { getDefaultMessageTemplate } from "../utils/localStorage";

interface AdminPanelProps {
  settings: AdminSettings;
  onSettingsChange: (settings: AdminSettings) => void;
  messageTemplate: MessageTemplate;
  onTemplateChange: (template: MessageTemplate) => void;
}

export interface AdminPanelRef {
  open: () => void;
  openWithExam: (
    gradeLevel: GradeLevel,
    examWeek: string,
    subjectType?: SubjectType,
  ) => void;
}

export const AdminPanel = forwardRef<
  AdminPanelRef,
  AdminPanelProps
>(
  (
    {
      settings,
      onSettingsChange,
      messageTemplate,
      onTemplateChange,
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedGrade, setSelectedGrade] =
      useState<string>("middle3_high1");
    const [selectedSubject, setSelectedSubject] =
      useState<string>("language_media");
    const [selectedWeek, setSelectedWeek] =
      useState<string>("");
    const [editingConfig, setEditingConfig] =
      useState<ExamConfig | null>(null);
    const [editingTemplate, setEditingTemplate] =
      useState<MessageTemplate>(messageTemplate);
    const [editingExplanation, setEditingExplanation] =
      useState<{
        area: AreaType;
        item: ExplanationItem;
      } | null>(null);

    // Expose methods to open dialog
    useImperativeHandle(ref, () => ({
      open: () => {
        setIsOpen(true);
      },
      openWithExam: (
        gradeLevel: GradeLevel,
        examWeek: string,
        subjectType?: SubjectType,
      ) => {
        setSelectedGrade(gradeLevel);
        setSelectedWeek(examWeek);
        if (subjectType) {
          setSelectedSubject(subjectType);
        }
        setIsOpen(true);
        // Auto-load config after state is set
        setTimeout(() => {
          loadConfigDirectly(gradeLevel, examWeek, subjectType);
        }, 100);
      },
    }));

    const availableWeeks = getAvailableWeeks();

    // Sync editingTemplate with prop when dialog opens
    useEffect(() => {
      if (isOpen) {
        setEditingTemplate(messageTemplate);
      }
    }, [isOpen, messageTemplate]);

    // 현재 선택된 시험 설정 가져오기
    const getCurrentConfig = (): ExamConfig | null => {
      if (!selectedWeek) return null;

      if (selectedGrade === "middle3_high1") {
        return (
          settings.middle3_high1[selectedWeek] ||
          createDefaultConfig()
        );
      } else if (selectedGrade === "high2") {
        return (
          settings.high2[
            selectedSubject as
              | "language_media"
              | "speech_writing"
          ][selectedWeek] || createDefaultConfig()
        );
      } else if (selectedGrade === "high3") {
        return (
          settings.high3[
            selectedSubject as
              | "language_media"
              | "speech_writing"
          ][selectedWeek] || createDefaultConfig()
        );
      }
      return null;
    };

    const createDefaultConfig = (): ExamConfig => {
      const base: ExamConfig = {
        gradeLevel: selectedGrade as any,
        examWeek: selectedWeek,
        isHard: false,
        gradeCuts: {
          grade1: 0,
          grade2: 0,
          grade3: 0,
          grade4: 0,
        },
        explanations: {
          reading_theory: [],
          reading: [],
          literature: [],
        },
      };

      if (selectedGrade === "middle3_high1") {
        base.explanations.grammar = [];
      } else {
        base.subjectType = selectedSubject as any;
        if (selectedSubject === "language_media") {
          base.explanations.language_media = [];
        } else {
          base.explanations.speech_writing = [];
        }
      }

      return base;
    };

    const saveConfig = (config: ExamConfig) => {
      const newSettings = JSON.parse(JSON.stringify(settings));

      if (selectedGrade === "middle3_high1") {
        newSettings.middle3_high1[selectedWeek] = config;
      } else if (
        selectedGrade === "high2" ||
        selectedGrade === "high3"
      ) {
        const gradeSettings =
          selectedGrade === "high2"
            ? newSettings.high2
            : newSettings.high3;

        // 현재 선택된 과목에 저장
        gradeSettings[selectedSubject][selectedWeek] = config;

        // 1~34번 해설을 반대쪽 과목에도 동기화
        const otherSubject =
          selectedSubject === "language_media"
            ? "speech_writing"
            : "language_media";

        // 반대쪽 과목 설정 가져오기 또는 생성
        if (!gradeSettings[otherSubject][selectedWeek]) {
          gradeSettings[otherSubject][selectedWeek] =
            createDefaultConfigFor(
              selectedGrade,
              selectedWeek,
              otherSubject,
            );
        }

        const otherConfig =
          gradeSettings[otherSubject][selectedWeek];

        // 1~34번 공통 영역 해설만 동기화 (등급컷과 난이도는 과목마다 다르므로 동기화하지 않음)
        ["reading_theory", "reading", "literature"].forEach(
          (area) => {
            const areaKey = area as AreaType;
            if (config.explanations[areaKey]) {
              const sharedExplanations = (
                config.explanations[
                  areaKey
                ] as ExplanationItem[]
              ).filter(
                (exp) =>
                  exp.questionNumber >= 1 &&
                  exp.questionNumber <= 34,
              );

              if (!otherConfig.explanations[areaKey]) {
                otherConfig.explanations[areaKey] = [];
              }

              // 기존 1~34번 해설 제거하고 새로운 것으로 교체
              const otherExplanations = (
                otherConfig.explanations[
                  areaKey
                ] as ExplanationItem[]
              ).filter(
                (exp) =>
                  exp.questionNumber < 1 ||
                  exp.questionNumber > 34,
              );

              otherConfig.explanations[areaKey] = [
                ...otherExplanations,
                ...sharedExplanations,
              ];
            }
          },
        );
      }

      onSettingsChange(newSettings);
      toast.success("설정이 저장되었습니다.");
    };

    const handleGradeCutChange = (
      grade: "grade1" | "grade2" | "grade3" | "grade4",
      value: string,
    ) => {
      if (!editingConfig) return;
      const newConfig = {
        ...editingConfig,
        gradeCuts: {
          ...editingConfig.gradeCuts,
          [grade]: parseInt(value) || 0,
        },
      };
      setEditingConfig(newConfig);
    };

    const loadConfig = () => {
      const config = getCurrentConfig();
      setEditingConfig(config);
    };

    const loadConfigDirectly = (
      gradeLevel: string,
      examWeek: string,
      subjectType?: string,
    ) => {
      let config: ExamConfig | null = null;

      if (gradeLevel === "middle3_high1") {
        config =
          settings.middle3_high1[examWeek] ||
          createDefaultConfigFor(
            gradeLevel,
            examWeek,
            subjectType,
          );
      } else if (gradeLevel === "high2" && subjectType) {
        config =
          settings.high2[
            subjectType as "language_media" | "speech_writing"
          ][examWeek] ||
          createDefaultConfigFor(
            gradeLevel,
            examWeek,
            subjectType,
          );
      } else if (gradeLevel === "high3" && subjectType) {
        config =
          settings.high3[
            subjectType as "language_media" | "speech_writing"
          ][examWeek] ||
          createDefaultConfigFor(
            gradeLevel,
            examWeek,
            subjectType,
          );
      }

      setEditingConfig(config);
    };

    const createDefaultConfigFor = (
      gradeLevel: string,
      examWeek: string,
      subjectType?: string,
    ): ExamConfig => {
      const base: ExamConfig = {
        gradeLevel: gradeLevel as any,
        examWeek: examWeek,
        isHard: false,
        gradeCuts: {
          grade1: 0,
          grade2: 0,
          grade3: 0,
          grade4: 0,
        },
        explanations: {
          reading_theory: [],
          reading: [],
          literature: [],
        },
      };

      if (gradeLevel === "middle3_high1") {
        base.explanations.grammar = [];
      } else {
        base.subjectType = subjectType as any;
        if (subjectType === "language_media") {
          base.explanations.language_media = [];
        } else {
          base.explanations.speech_writing = [];
        }
      }

      return base;
    };

    const handleSave = () => {
      if (editingConfig) {
        saveConfig(editingConfig);
      }
    };

    // 해설 삭제
    const handleDeleteExplanation = (
      area: AreaType,
      questionNumber: number,
    ) => {
      if (!editingConfig) return;

      const newConfig = { ...editingConfig };
      const explanations = newConfig.explanations[
        area
      ] as ExplanationItem[];
      newConfig.explanations[area] = explanations.filter(
        (exp) => exp.questionNumber !== questionNumber,
      );

      setEditingConfig(newConfig);

      const isSharedQuestion =
        (selectedGrade === "high2" ||
          selectedGrade === "high3") &&
        questionNumber >= 1 &&
        questionNumber <= 34;
      const message = isSharedQuestion
        ? `${questionNumber}번 해설이 삭제되었습니다 (양쪽 과목에서 삭제됩니다)`
        : `${questionNumber}번 해설이 삭제되었습니다`;
      toast.success(message);
    };

    // 해설 수정 저장
    const handleSaveExplanation = (
      area: AreaType,
      questionNumber: number,
      newExplanation: string,
    ) => {
      if (!editingConfig) return;

      const newConfig = { ...editingConfig };
      const explanations = newConfig.explanations[
        area
      ] as ExplanationItem[];
      const index = explanations.findIndex(
        (exp) => exp.questionNumber === questionNumber,
      );

      if (index >= 0) {
        explanations[index].explanation = newExplanation;
        setEditingConfig(newConfig);
        setEditingExplanation(null);

        const isSharedQuestion =
          (selectedGrade === "high2" ||
            selectedGrade === "high3") &&
          questionNumber >= 1 &&
          questionNumber <= 34;
        const message = isSharedQuestion
          ? `${questionNumber}번 해설이 수정되었습니다 (양쪽 과목에 적용됩니다)`
          : `${questionNumber}번 해설이 수정되었습니다`;
        toast.success(message);
      }
    };

    // 영역명 한글 변환
    const getAreaName = (area: AreaType): string => {
      // 중3/고1 전용 라벨
      let areaNames: Record<AreaType, string>;

      if (selectedGrade === "middle3_high1") {
        areaNames = {
          reading_theory: "화작",
          grammar: "문법",
          reading: "독서",
          literature: "문학",
          language_media: "언어와매체",
          speech_writing: "화법과작문",
          overall: "전반적 영역",
          none: "따로없음",
        };
      } else {
        // 고2/고3 라벨
        areaNames = {
          reading_theory: "독서론",
          grammar: "어법",
          reading: "독서",
          literature: "문학",
          language_media: "언어와매체",
          speech_writing: "화법과작문",
          overall: "전반적 영역",
          none: "따로없음",
        };
      }

      const baseName = areaNames[area];

      // 고2/고3일 때 번호 범위 추가
      if (
        selectedGrade === "high2" ||
        selectedGrade === "high3"
      ) {
        switch (area) {
          case "reading_theory":
            return `${baseName} (1~3번)`;
          case "reading":
            return `${baseName} (4~17번)`;
          case "literature":
            return `${baseName} (18~34번)`;
          case "language_media":
            return `${baseName} (35~45번)`;
          case "speech_writing":
            return `${baseName} (35~45번)`;
          default:
            return baseName;
        }
      }

      return baseName;
    };

    // 해설 목록 렌더링
    const renderExplanations = () => {
      if (!editingConfig) return null;

      const areas: AreaType[] =
        selectedGrade === "middle3_high1"
          ? [
              "reading_theory",
              "grammar",
              "reading",
              "literature",
            ]
          : selectedSubject === "language_media"
            ? [
                "reading_theory",
                "reading",
                "literature",
                "language_media",
              ]
            : [
                "reading_theory",
                "reading",
                "literature",
                "speech_writing",
              ];

      return areas
        .map((area) => {
          const explanations = (editingConfig.explanations[
            area
          ] || []) as ExplanationItem[];
          if (explanations.length === 0) return null;

          return (
            <Card key={area} className="p-4">
              <h4 className="mb-3">{getAreaName(area)}</h4>
              <div className="space-y-2">
                {explanations
                  .sort(
                    (a, b) =>
                      a.questionNumber - b.questionNumber,
                  )
                  .map((exp) => (
                    <div
                      key={exp.questionNumber}
                      className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg"
                    >
                      {editingExplanation?.area === area &&
                      editingExplanation?.item
                        .questionNumber ===
                        exp.questionNumber ? (
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm shrink-0">
                              {exp.questionNumber}번
                            </span>
                            <Textarea
                              className="flex-1"
                              value={
                                editingExplanation.item
                                  .explanation
                              }
                              onChange={(e) =>
                                setEditingExplanation({
                                  ...editingExplanation,
                                  item: {
                                    ...editingExplanation.item,
                                    explanation: e.target.value,
                                  },
                                })
                              }
                              rows={2}
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setEditingExplanation(null)
                              }
                            >
                              취소
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleSaveExplanation(
                                  area,
                                  exp.questionNumber,
                                  editingExplanation.item
                                    .explanation,
                                )
                              }
                            >
                              저장
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm shrink-0">
                            {exp.questionNumber}번
                          </span>
                          <p className="text-sm flex-1">
                            {exp.explanation}
                          </p>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setEditingExplanation({
                                  area,
                                  item: { ...exp },
                                })
                              }
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleDeleteExplanation(
                                  area,
                                  exp.questionNumber,
                                )
                              }
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
              </div>
            </Card>
          );
        })
        .filter(Boolean);
    };

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            설정
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>설정</DialogTitle>
            <DialogDescription>
              등급컷 및 해설, 문자 템플릿을 관리합니다.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="exam" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="exam">등급컷/해설 관리</TabsTrigger>
              <TabsTrigger value="template">
                문자 템플릿
              </TabsTrigger>
            </TabsList>

            <TabsContent value="exam" className="space-y-6">
              {/* 시험 선택 */}
              <Card className="p-4">
                <h3 className="mb-4">시험 선택</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>학년</Label>
                    <Select
                      value={selectedGrade}
                      onValueChange={setSelectedGrade}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="middle3_high1">
                          중3/고1
                        </SelectItem>
                        <SelectItem value="high2">
                          고2
                        </SelectItem>
                        <SelectItem value="high3">
                          고3
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(selectedGrade === "high2" ||
                    selectedGrade === "high3") && (
                    <div className="space-y-2">
                      <Label>선택과목</Label>
                      <Select
                        value={selectedSubject}
                        onValueChange={setSelectedSubject}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="language_media">
                            언어와 매체
                          </SelectItem>
                          <SelectItem value="speech_writing">
                            화법과 작문
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>주차</Label>
                    <Select
                      value={selectedWeek}
                      onValueChange={setSelectedWeek}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="주차 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableWeeks.map((week) => (
                          <SelectItem
                            key={week.display}
                            value={week.display}
                          >
                            {week.display}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedWeek && (
                  <Button
                    onClick={loadConfig}
                    className="mt-4 w-full"
                  >
                    설정 불러오기
                  </Button>
                )}
              </Card>

              {/* 설정 편집 */}
              {editingConfig && (
                <div className="space-y-4">
                  <Card className="p-4">
                    <h3 className="mb-4">난이도</h3>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isHard"
                        checked={editingConfig.isHard}
                        onCheckedChange={(checked) =>
                          setEditingConfig({
                            ...editingConfig,
                            isHard: !!checked,
                          })
                        }
                      />
                      <Label
                        htmlFor="isHard"
                        className="cursor-pointer"
                      >
                        어려운 시험 (격려 멘트 추가)
                      </Label>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h3 className="mb-4">
                      등급컷 설정 (1-4등급)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>1등급</Label>
                        <Input
                          type="number"
                          value={
                            editingConfig.gradeCuts.grade1 || ""
                          }
                          onChange={(e) =>
                            handleGradeCutChange(
                              "grade1",
                              e.target.value,
                            )
                          }
                          placeholder="점수"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>2등급</Label>
                        <Input
                          type="number"
                          value={
                            editingConfig.gradeCuts.grade2 || ""
                          }
                          onChange={(e) =>
                            handleGradeCutChange(
                              "grade2",
                              e.target.value,
                            )
                          }
                          placeholder="점수"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>3등급</Label>
                        <Input
                          type="number"
                          value={
                            editingConfig.gradeCuts.grade3 || ""
                          }
                          onChange={(e) =>
                            handleGradeCutChange(
                              "grade3",
                              e.target.value,
                            )
                          }
                          placeholder="점수"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>4등급</Label>
                        <Input
                          type="number"
                          value={
                            editingConfig.gradeCuts.grade4 || ""
                          }
                          onChange={(e) =>
                            handleGradeCutChange(
                              "grade4",
                              e.target.value,
                            )
                          }
                          placeholder="점수"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* 저장된 해설 관리 */}
                  <Card className="p-4">
                    <div className="mb-4">
                      <h3 className="mb-2">저장된 해설 관리</h3>
                      <p className="text-sm text-muted-foreground">
                        홈 화면에서 자동 저장된 해설을
                        수정하거나 삭제할 수 있습니다.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {renderExplanations()}
                      {!renderExplanations() && (
                        <p className="text-sm text-muted-foreground text-center py-6">
                          저장된 해설이 없습니다.
                          <br />홈 화면에서 번호별 피드백을 입력하면
                          자동으로 저장됩니다.
                        </p>
                      )}
                    </div>
                  </Card>

                  <Button
                    onClick={handleSave}
                    className="w-full"
                  >
                    저장
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="template" className="space-y-6">
              <Card className="p-6 space-y-6">
                <div>
                  <h3 className="mb-2">문자 템플릿 편집</h3>
                  <p className="text-sm text-muted-foreground">
                    문자 내용을 커스텀할 수
                    있습니다. {"{firstName}"}은 자동으로 성을 제외한 학생
                    이름으로 치환되며, "(이)는"은 자동으로
                    받침에 맞게 조정됩니다.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>총평 문구</Label>
                  <Textarea
                    rows={3}
                    value={editingTemplate.closing}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        closing: e.target.value,
                      })
                    }
                    placeholder="이번 모의고사에서 {firstName}(이)는 ..."
                  />
                  <p className="text-xs text-muted-foreground">
                    모든 학생에게 공통으로 사용되는 총평
                    문구입니다.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>어려운 시험 문구</Label>
                  <Textarea
                    rows={3}
                    value={editingTemplate.hardExamPhrase}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        hardExamPhrase: e.target.value,
                      })
                    }
                    placeholder="비교적 어려운 난이도의 시험이었습니다. ..."
                  />
                  <p className="text-xs text-muted-foreground">
                    시험 난이도를 "어려움"으로 설정했을 때 총평
                    앞에 추가됩니다.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>마무리 문구</Label>
                  <Textarea
                    rows={3}
                    value={editingTemplate.endingMessage}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        endingMessage: e.target.value,
                      })
                    }
                    placeholder="앞으로도 좋은 성적을 낼 수 있도록..."
                  />
                  <p className="text-xs text-muted-foreground">
                    문자의 맨 마지막에 추가되는 마무리
                    인사말입니다.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingTemplate(
                        getDefaultMessageTemplate(),
                      );
                      toast.info(
                        "기본 템플릿으로 초기화되었습니다.",
                      );
                    }}
                    className="flex-1"
                  >
                    기본값으로 초기화
                  </Button>
                  <Button
                    onClick={() => {
                      onTemplateChange(editingTemplate);
                      toast.success(
                        "문자 템플릿이 저장되었습니다!",
                      );
                    }}
                    className="flex-1"
                  >
                    변경내용 저장
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  },
);

AdminPanel.displayName = "AdminPanel";