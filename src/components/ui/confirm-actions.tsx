import Button from '@/components/ui/button';
import { COMMON_TEXT } from '@/constants/text/common';

interface Props {
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * 확인 화면 아래에 놓는 취소 · 실행 버튼 행.
 *
 * `isFullWidth` 를 쓰지 않는다. `w-full` 버튼 두 개를 한 행에 나란히 두면 각자 컨테이너
 * 전체 폭을 요구하고, Button 의 기본 클래스에 `shrink-0` 이 있어 줄지도 않아 행이 가로로
 * 넘친다. `flex-1` 은 같은 폭을 basis 0 에서 나눠 가지므로 넘치지 않는다.
 *
 * 실행 버튼에 `autoFocus` 를 준다. 화면이 바뀐 것을 스크린리더가 그 순간 읽고, 키보드로
 * 왔다면 바로 닿는다. 되돌릴 수 없는 동작이라 `danger-solid` 로 둔다.
 */
const ConfirmActions = ({
  confirmLabel = COMMON_TEXT.remove,
  cancelLabel = COMMON_TEXT.cancel,
  onCancel,
  onConfirm,
}: Props) => {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="lg" onClick={onCancel} className="flex-1">
        {cancelLabel}
      </Button>

      <Button variant="danger-solid" size="lg" autoFocus onClick={onConfirm} className="flex-1">
        {confirmLabel}
      </Button>
    </div>
  );
};

export default ConfirmActions;
