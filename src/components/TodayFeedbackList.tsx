import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { CheckCircle2, Trash2, Users } from "lucide-react";
import { FeedbackRecord } from "../types";
import {
  getTodayFeedbackRecords,
  deleteFeedbackRecord,
} from "../utils/localStorage";
import { toast } from "sonner@2.0.3";

interface TodayFeedbackListProps {
  onUpdate?: () => void;
}

export function TodayFeedbackList({ onUpdate }: TodayFeedbackListProps) {
  const [records, setRecords] = useState<FeedbackRecord[]>([]);

  const loadRecords = () => {
    const todayRecords = getTodayFeedbackRecords();
    // 최신순으로 정렬
    todayRecords.sort((a, b) => b.timestamp - a.timestamp);
    setRecords(todayRecords);
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleDelete = (
    e: React.MouseEvent,
    id: string,
    studentName: string,
  ) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    if (confirm(`${studentName} 학생의 피드백 기록을 삭제하시겠습니까?`)) {
      deleteFeedbackRecord(id);
      loadRecords();
      toast.success("기록이 삭제되었습니다.");
      if (onUpdate) {
        onUpdate();
      }
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        <h4 className="text-sm text-primary">
          오늘 작성한 피드백 ({records.length}명)
        </h4>
      </div>

      {records.length === 0 ? (
        <div className="py-6 text-center">
          <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground mb-1">
            아직 피드백한 학생이 없습니다
          </p>
          <p className="text-xs text-muted-foreground">
            문자를 복사하면 자동으로 기록됩니다
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {records.map((record) => (
              <div key={record.id} className="group relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 pr-8 cursor-default"
                  // 클릭 이벤트 제거 → 단순 표시용
                >
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  {record.studentData.name}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) =>
                    handleDelete(e, record.id, record.studentData.name)
                  }
                  className="absolute right-0 top-0 h-full w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="삭제"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            *자정이 지나면 자동 삭제됩니다.
          </div>
        </>
      )}
    </Card>
  );
}
