import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  HelpCircle,
  Settings,
  FileEdit,
  Copy,
} from "lucide-react";

export function HowToUseDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          사용방법
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            사용방법
          </DialogTitle>
          <DialogDescription>
            모의고사 피드백 문자 생성기 사용 가이드
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Step 1 */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1">
                1
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <h3>설정</h3>
                </div>
                <p className="text-muted-foreground">
                  설정에서 등급컷을
                  등록해 자동으로 등급을 계산합니다.
                </p>
                <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                  <p>
                    <strong>• 등급컷 저장:</strong>{" "}
                    학년/주차/선택과목별 등급컷 입력 후 저장합니다. 문자 생성 시 입력된 원점수가 5등급 이하일 경우 문자에 등급이 표시되지 않습니다.
                  </p>
                  <p>
                    <strong>• 해설 관리:</strong> 각 영역별로
                    자동 저장된 해설을 수정 및 삭제할 수
                    있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1">
                2
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <FileEdit className="h-5 w-5 text-primary" />
                  <h3>학생 정보 및 피드백 입력</h3>
                </div>
                <p className="text-muted-foreground">
                  학생 이름, 학년, 점수, 피드백을 입력합니다.
                </p>
                <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                  <p>
                    <strong>• 기본 정보:</strong> 이름, 학년,
                    시험 주차, 점수를 입력합니다.
                  </p>
                  <p>
                    <strong>• 지난 시험지 안내:</strong> 이전 주차
                    선택시 지난 모의고사임을 알리는 문구가 추가됩니다.
                  </p>
                  <p>
                    <strong>• 주요 오답 영역:</strong> 중복
                    선택 가능하며, 문자에 표시됩니다.
                  </p>
                  <p>
                    <strong>• 영역별 피드백:</strong> 해당하는
                    영역에 문제 번호와 해설을 입력합니다.
                  </p>
                  <p>
                    <strong>• 자동 저장:</strong> 한 번 입력한 해설은 저장되어 다른 학생에게 동일번호 중복해설시 자동 완성됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1">
                3
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Copy className="h-5 w-5 text-primary" />
                  <h3>문자 복사 및 전송</h3>
                </div>
                <p className="text-muted-foreground">
                  자동 생성된 문자를 복사하여 전송합니다.
                </p>
                <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                  <p>
                    <strong>• 미리보기:</strong> 오른쪽 패널에서
                    실시간으로 생성된 문자를 확인할 수 있습니다.
                  </p>
                  <p>
                    <strong>• 복사하기:</strong> "복사하기"
                    버튼을 클릭하면 클립보드에 복사됩니다.
                  </p>
                  <p>
                    <strong>• 오늘의 피드백:</strong> 문자를 복사한 내역(학생이름)이 표시되며, 마우스를 올려놓으면 나타나는 휴지통을 클릭해 삭제할 수 있습니다. 내역은 자정 이후 자동으로 초기화됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 추가 팁 */}
          <div className="border-t pt-4 space-y-2">
            <h4 className="text-primary">💡 추가 팁</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                • 모든 작업은 등급컷 설정 이후에 가능합니다. 기능이 작동하지 않는다면 해당 시험의 등급컷을 저장했는지 확인하세요.
              </p>
              <p>
                • 고2와 고3은 선택과목을 반드시 선택해야 합니다. 1~34번 공통 문제는 선택과목과 무관하게 해설이 동기화됩니다.
              </p>
              <p>
                • 사이트 종료 후에도 입력한 등급컷과 해설은 보존됩니다. 지난 주의 내용도 마찬가지입니다. 다만, 브라우저 캐시 삭제나 시크릿 모드에서는 데이터가 유지되지 않을 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}