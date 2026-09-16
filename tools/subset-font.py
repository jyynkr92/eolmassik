"""
SUIT Variable 서브셋 생성기.

카톡 링크로 들어오는 첫 화면에서 원본 610KB 는 진입 JS 보다 무겁다.
한글은 상용 2,350자(KS X 1001 기본 한글)만 남기고, 나머지는 시스템 폰트가 받는다.
가변 축은 실제로 쓰는 400~700 으로 좁힌다. 글자 수만 줄이면 610KB → 509KB 에 그치는데,
용량의 상당 부분이 굵기별 델타 데이터라서 축을 좁히는 쪽이 더 크게 준다.

  python3 tools/subset-font.py

원본은 assets/fonts/SUIT-Variable-full.woff2 에 보관한다. (서비스되지 않는 경로다)
"""

import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'assets' / 'fonts' / 'SUIT-Variable-full.woff2'
TARGET = ROOT / 'public' / 'fonts' / 'SUIT-Variable.woff2'

# globals.css 의 @font-face `font-weight` 와 반드시 같아야 한다
WEIGHT_RANGE = '400:700'


def ks_x_1001_hangul() -> str:
    """KS X 1001 기본 한글 2,350자. EUC-KR 선행 바이트 0xB0~0xC8 구간이 그 집합이다."""
    syllables = []

    for code in range(0xAC00, 0xD7A4):
        try:
            encoded = chr(code).encode('euc-kr')
        except UnicodeEncodeError:
            continue
        if 0xB0 <= encoded[0] <= 0xC8:
            syllables.append(chr(code))

    return ''.join(syllables)


def main() -> int:
    hangul = ks_x_1001_hangul()
    if len(hangul) != 2350:
        print(f'상용 한글이 2,350자가 아닙니다: {len(hangul)}자', file=sys.stderr)
        return 1

    # 라틴·숫자·문장부호, 한글 호환 자모(ㄱ, ㅏ 단독 표기), 원화·화살표 등 화면에서 쓰는 기호
    unicodes = [
        'U+0020-007E',
        'U+00A0-00FF',
        'U+2000-206F',
        'U+20A9,U+20AC',
        'U+2190-2193',
        'U+2022,U+2026,U+00B7',
        'U+3130-318F',
        'U+3000-303F',
        'U+FF01-FF5E',
    ]

    with tempfile.TemporaryDirectory() as workspace:
        narrowed = Path(workspace) / 'narrowed.ttf'

        # 1) 굵기 축을 먼저 좁힌다
        subprocess.run(
            [sys.executable, '-m', 'fontTools.varLib.instancer',
             str(SOURCE), f'wght={WEIGHT_RANGE}', '-o', str(narrowed)],
            check=True,
        )

        # 2) 글리프를 줄이고 woff2 로 다시 압축한다
        subprocess.run(
            [sys.executable, '-m', 'fontTools.subset', str(narrowed),
             f'--text={hangul}',
             f'--unicodes={",".join(unicodes)}',
             '--flavor=woff2',
             f'--output-file={TARGET}',
             '--layout-features=*',
             '--name-IDs=*',
             '--no-hinting'],
            check=True,
        )

    before = SOURCE.stat().st_size
    after = TARGET.stat().st_size
    print(f'{before / 1024:.0f}KB → {after / 1024:.0f}KB ({100 - after / before * 100:.0f}% 감소)')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
