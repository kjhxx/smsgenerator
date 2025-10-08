import { Card } from './ui/card';
import { Button } from './ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';
import { Student } from '../types';
import { saveFeedbackRecord } from '../utils/localStorage';

interface MessagePreviewProps {
  message: string;
  studentData: Student;
  onCopySuccess?: () => void;
}

export function MessagePreview({ 
  message, 
  studentData,
  onCopySuccess 
}: MessagePreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!message) {
      toast.error('복사할 내용이 없습니다.');
      return;
    }

    // Fallback 방식을 우선 사용 (Figma Make 환경에서 더 안정적)
    const copyWithFallback = () => {
      const textarea = document.createElement('textarea');
      textarea.value = message;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.setAttribute('readonly', '');
      document.body.appendChild(textarea);
      
      // iOS 호환성
      const isIOS = navigator.userAgent.match(/ipad|iphone/i);
      if (isIOS) {
        const range = document.createRange();
        range.selectNodeContents(textarea);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        textarea.setSelectionRange(0, message.length);
      } else {
        textarea.select();
      }
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (successful) {
          setCopied(true);
          toast.success('문자가 클립보드에 복사되었습니다!');
          
          // 피드백 기록 저장
          if (studentData.name && studentData.score > 0) {
            saveFeedbackRecord(studentData);
          }
          
          // 성공 콜백 호출
          if (onCopySuccess) {
            onCopySuccess();
          }
          
          setTimeout(() => setCopied(false), 2000);
          return true;
        } else {
          toast.error('복사에 실패했습니다.');
          return false;
        }
      } catch (err) {
        document.body.removeChild(textarea);
        console.error('Copy error:', err);
        toast.error('복사에 실패했습니다.');
        return false;
      }
    };

    // 먼저 fallback 방식 시도
    const fallbackSuccess = copyWithFallback();
    
    // fallback이 실패하면 Clipboard API 시도 (최신 브라우저용)
    if (!fallbackSuccess && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message)
        .then(() => {
          setCopied(true);
          toast.success('문자가 클립보드에 복사되었습니다!');
          
          // 피드백 기록 저장
          if (studentData.name && studentData.score > 0) {
            saveFeedbackRecord(studentData);
          }
          
          // 성공 콜백 호출
          if (onCopySuccess) {
            onCopySuccess();
          }
          
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((error) => {
          console.error('Clipboard API error:', error);
          // 이미 fallback이 실패했으므로 추가 에러 메시지는 표시하지 않음
        });
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3>문자 미리보기</h3>
        <Button
          onClick={handleCopy}
          variant={copied ? "secondary" : "default"}
          size="sm"
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              복사됨
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              복사하기
            </>
          )}
        </Button>
      </div>

      <div className="bg-muted rounded-lg p-6 min-h-[300px] whitespace-pre-wrap font-mono text-sm">
        {message || (
          <div className="text-muted-foreground text-center py-12">
            여기에 문자가 생성됩니다.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
        <span>총 {message.length}자</span>
        {studentData.name && <span>{studentData.name} 학생</span>}
      </div>
    </Card>
  );
}
