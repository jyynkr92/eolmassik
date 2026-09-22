import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { decodeSettlement } from '@/lib/codec';
import { shareSettlementToKakao } from '@/lib/share/share-settlement-to-kakao';
import { useSettlementStore } from '@/store/settlement-store';
import type { Settlement } from '@/types/settlement';

import ResultSection from './result-section';

vi.mock('@/lib/share/share-settlement-to-kakao', () => ({
  shareSettlementToKakao: vi.fn(),
}));

const settlement: Settlement = {
  id: 's1',
  title: '캠핑 정산',
  createdAt: 0,
  defaultPayerId: 'minsu',
  participants: [
    { id: 'minsu', name: '민수', headcount: 1 },
    { id: 'eunjeong', name: '은정', headcount: 1 },
  ],
  items: [
    {
      id: 'meat',
      name: '고기',
      amount: 32_000,
      payerId: 'minsu',
      participantIds: ['minsu', 'eunjeong'],
      extraCharges: [{ participantId: 'minsu', type: 'amount', value: 12_000 }],
    },
  ],
  options: { rounding: 'none', roundingAbsorber: 'payer', fullChargeSplit: 'even' },
};

describe('ResultSection', () => {
  beforeEach(() => {
    Reflect.deleteProperty(navigator, 'share');
    vi.stubEnv('VITE_KAKAO_JS_KEY', '');
    vi.mocked(shareSettlementToKakao).mockResolvedValue({ success: true });
    useSettlementStore.getState().actions.replaceSettlement(settlement);
  });

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'share');
    vi.unstubAllEnvs();
  });

  it('결제자, 설정한 추가 부담, 실제 항목별 부담액과 최종 송금을 보여준다', async () => {
    const user = userEvent.setup();
    render(<ResultSection headingRef={createRef()} onEdit={vi.fn()} />);

    expect(screen.getByRole('heading', { name: '캠핑 정산' })).toBeInTheDocument();
    expect(screen.getByText('은정 → 민수')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: '정산 결과' })).getByText('10,000원'),
    ).toBeInTheDocument();

    await user.click(screen.getByText('고기'));
    const detail = screen.getByText('항목별 부담 금액').parentElement;
    if (!detail) throw new Error('항목 부담액 영역이 없습니다');

    expect(screen.getByText('민수 결제 ·')).toBeInTheDocument();
    expect(screen.getByText('민수 12,000원')).toBeInTheDocument();
    expect(within(detail).getByText('22,000원')).toBeInTheDocument();
    expect(within(detail).getByText('10,000원')).toBeInTheDocument();
  });

  it('송금이 필요 없을 때 안내하고 편집으로 돌아갈 수 있다', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const participant = settlement.participants[0];
    const item = settlement.items[0];
    if (!participant || !item) throw new Error('테스트 정산 항목이 없습니다');

    useSettlementStore.getState().actions.replaceSettlement({
      ...settlement,
      participants: [participant],
      items: [
        {
          ...item,
          participantIds: ['minsu'],
          extraCharges: [],
        },
      ],
    });

    render(<ResultSection headingRef={createRef()} onEdit={onEdit} />);

    expect(screen.getByText('서로 보낼 돈이 없어요')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '수정하기' }));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('여러 사람이 결제한 항목을 모두 합쳐 최종 송금을 계산한다', async () => {
    const user = userEvent.setup();
    useSettlementStore.getState().actions.replaceSettlement({
      ...settlement,
      items: [
        ...settlement.items,
        {
          id: 'market',
          name: '마트',
          amount: 8_000,
          payerId: 'eunjeong',
          participantIds: ['minsu', 'eunjeong'],
          extraCharges: [],
        },
      ],
    });

    render(<ResultSection headingRef={createRef()} onEdit={vi.fn()} />);

    const transfers = screen.getByRole('region', { name: '정산 결과' });
    expect(within(transfers).getByText('은정 → 민수')).toBeInTheDocument();
    expect(within(transfers).getByText('6,000원')).toBeInTheDocument();

    await user.click(screen.getByText('마트'));
    expect(screen.getByText('은정 결제 ·')).toBeInTheDocument();
    expect(screen.getAllByText('4,000원')).toHaveLength(2);
  });

  it('상세 항목을 독립적으로 열고 키보드로 닫을 수 있다', async () => {
    const user = userEvent.setup();
    const item = settlement.items[0];
    if (!item) throw new Error('테스트 정산 항목이 없습니다');

    useSettlementStore.getState().actions.replaceSettlement({
      ...settlement,
      items: [
        item,
        {
          ...item,
          id: 'market',
          name: '마트',
          amount: 8_000,
          extraCharges: [],
        },
      ],
    });
    render(<ResultSection headingRef={createRef()} onEdit={vi.fn()} />);

    const meatButton = screen.getByRole('button', { name: /고기/ });
    const marketButton = screen.getByRole('button', { name: /마트/ });
    const panel = document.getElementById(meatButton.getAttribute('aria-controls') ?? '');
    if (!panel) throw new Error('상세 항목 패널이 없습니다');

    expect(meatButton).toHaveAttribute('aria-expanded', 'false');
    expect(panel).toHaveAttribute('aria-hidden', 'true');
    expect(panel).toHaveAttribute('inert');

    await user.click(meatButton);
    expect(meatButton).toHaveAttribute('aria-expanded', 'true');
    expect(panel).toHaveAttribute('aria-hidden', 'false');
    expect(panel).not.toHaveAttribute('inert');
    expect(marketButton).toHaveAttribute('aria-expanded', 'false');

    await user.keyboard(' ');
    expect(meatButton).toHaveAttribute('aria-expanded', 'false');
    expect(panel).toHaveAttribute('aria-hidden', 'true');
  });

  it('참여자별 headcount를 합산하고 결과 카드 제목의 단계를 구분한다', () => {
    useSettlementStore.getState().actions.replaceSettlement({
      ...settlement,
      title: '',
      participants: settlement.participants.map((participant) =>
        participant.id === 'minsu' ? { ...participant, headcount: 2 } : participant,
      ),
    });

    render(<ResultSection headingRef={createRef()} onEdit={vi.fn()} />);

    expect(screen.getByText('3명 · 1개 항목')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '정산 결과' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '정산 결과' })).toBeInTheDocument();
    expect(screen.getAllByRole('region', { name: '정산 결과' })).toHaveLength(1);
  });

  it('정산 텍스트를 클립보드에 복사하고 성공을 알린다', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    render(<ResultSection headingRef={createRef()} onEdit={vi.fn()} />);

    const copyButton = screen.getByRole('button', { name: '텍스트 복사' });
    await user.click(copyButton);

    expect(writeText).toHaveBeenCalledWith(
      '🧾 캠핑 정산 · 총 32,000원\n\n· 고기 32,000원 (민수 결제)\n부담: 민수 22,000원 · 은정 10,000원\n\n💸 정산\n은정 → 민수 10,000원',
    );
    expect(screen.getByRole('status')).toHaveTextContent('정산 내역을 복사했어요');
    expect(screen.getByRole('status')).toHaveClass('animate-toast-in');
    expect(screen.getByRole('status')).toHaveClass(
      'bottom-[calc(env(safe-area-inset-bottom)+1.5rem)]',
    );
    expect(copyButton.querySelector('.lucide-check')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole('status')).toHaveClass('animate-toast-out'), {
      timeout: 3000,
    });
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument(), {
      timeout: 1000,
    });
    expect(copyButton.querySelector('.lucide-copy')).toBeInTheDocument();
  });

  it('클립보드 복사 실패를 알린다', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('NotAllowedError'));
    render(<ResultSection headingRef={createRef()} onEdit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '텍스트 복사' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      '복사하지 못했어요. 브라우저의 클립보드 권한을 확인해 주세요',
    );
  });

  it('정산 데이터를 fragment에 담은 읽기 전용 링크를 복사한다', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    render(<ResultSection headingRef={createRef()} onEdit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '링크 복사' }));

    const shareUrl = writeText.mock.calls[0]?.[0];
    expect(shareUrl).toMatch(/^http:\/\/localhost(?::\d+)?\/s#/u);
    if (!shareUrl) throw new Error('공유 링크가 없습니다');

    const decoded = decodeSettlement(new URL(shareUrl).hash.slice(1));
    expect(decoded.success).toBe(true);
    if (decoded.success) expect(decoded.data.title).toBe('캠핑 정산');
    expect(screen.getByRole('status')).toHaveTextContent('공유 링크를 복사했어요');
  });

  it('카카오 SDK 실패 시 같은 공유 링크를 클립보드에 복사한다', async () => {
    const user = userEvent.setup();
    vi.stubEnv('VITE_KAKAO_JS_KEY', 'test-key');
    vi.mocked(shareSettlementToKakao).mockResolvedValue({ success: false });
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    render(<ResultSection headingRef={createRef()} onEdit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '카카오톡 공유' }));

    expect(shareSettlementToKakao).toHaveBeenCalledWith(
      settlement,
      expect.stringMatching(/^http:\/\/localhost(?::\d+)?\/s#/u),
      'test-key',
    );
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/s#'));
    expect(screen.getByRole('status')).toHaveTextContent(
      '카카오톡을 열지 못해 공유 링크를 복사했어요',
    );
  });

  it('Web Share API를 지원하면 링크 복사 대신 다른 앱 공유를 제공한다', async () => {
    const user = userEvent.setup();
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    render(<ResultSection headingRef={createRef()} onEdit={vi.fn()} />);

    expect(screen.queryByRole('button', { name: '링크 복사' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '다른 앱으로 공유' }));

    expect(share).toHaveBeenCalledWith({
      title: '캠핑 정산',
      text: '총 32,000원 · 2명',
      url: expect.stringMatching(/^http:\/\/localhost(?::\d+)?\/s#/u),
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('시스템 공유 실패 시 링크 복사로 폴백한다', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn().mockRejectedValue(new Error('share failed')),
    });
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    render(<ResultSection headingRef={createRef()} onEdit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '다른 앱으로 공유' }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/s#'));
    expect(screen.getByRole('status')).toHaveTextContent('공유 창을 열지 못해 링크를 복사했어요');
  });

  it('읽기 전용 결과에서는 편집과 공유 액션을 숨긴다', () => {
    render(<ResultSection settlement={settlement} isReadOnly />);

    expect(screen.queryByRole('button', { name: '수정하기' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '텍스트 복사' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '링크 복사' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '다른 앱으로 공유' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '카카오톡 공유' })).not.toBeInTheDocument();
  });

  it('연속 복사에서는 이전 요청의 늦은 실패가 최신 성공을 덮지 않는다', async () => {
    const user = userEvent.setup();
    let rejectFirst: (reason: Error) => void = () => {};
    const firstWrite = new Promise<void>((_resolve, reject) => {
      rejectFirst = reject;
    });
    const writeText = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockImplementationOnce(() => firstWrite)
      .mockResolvedValueOnce();
    render(<ResultSection headingRef={createRef()} onEdit={vi.fn()} />);

    const copyButton = screen.getByRole('button', { name: '텍스트 복사' });
    await user.click(copyButton);
    await user.click(copyButton);
    expect(writeText).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('status')).toHaveTextContent('정산 내역을 복사했어요');

    await act(async () => {
      rejectFirst(new Error('이전 복사 실패'));
      await firstWrite.catch(() => {});
    });

    expect(screen.getByRole('status')).toHaveTextContent('정산 내역을 복사했어요');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
