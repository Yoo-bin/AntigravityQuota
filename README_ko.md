# antigravity-quota

opencode에서 Google Antigravity 사용하는 유저가 antigravity 사용량(Quota) 확인할 수 있는 CLI 도구입니다.

## 설치

```bash
# 저장소 클론
git clone https://github.com/Yoo-bin/antigravity-quota.git
cd antigravity-quota

# 의존성 설치
bun install

# 글로벌 설치
bun link
```

## 사용법

```bash
# 테이블 형식으로 쿼터 확인
ag quota

# API 원본 JSON 응답 출력
ag quota --raw
ag quota -r
```

## 쉘 자동완성

bash, zsh, fish 쉘에서 탭 자동완성을 사용할 수 있습니다.

```bash
# 자동 설치 (권장)
ag completion --install

# 또는 각 쉘별 수동 설정:

# Zsh
echo 'eval "$(ag completion zsh)"' >> ~/.zshrc

# Bash
echo 'eval "$(ag completion bash)"' >> ~/.bashrc

# Fish
echo 'ag completion fish | source' >> ~/.config/fish/config.fish
```

설정 후 쉘을 재시작하거나 `source ~/.zshrc` (또는 해당 쉘 설정 파일)를 실행하세요.

### 자동완성 예시

| 입력               | 자동완성 결과            |
|--------------------|--------------------------|
| `ag q<TAB>`        | `quota`                  |
| `ag c<TAB>`        | `completion`             |
| `ag quota -<TAB>`  | `--raw`, `-r`, `--help`  |

### 출력 예시

```
Account: user@gmail.com
┌──────────────┬────────┬───────────────────┐
│ Model        │ Quota  │ Reset Time        │
├──────────────┼────────┼───────────────────┤
│ gemini-3-pro │ 100.0% │ in 5h             │
├──────────────┼────────┼───────────────────┤
│ gemini       │ 80.0%  │ in 6 days 23h 59m │
├──────────────┼────────┼───────────────────┤
│ claude       │ 53.0%  │ in 1 day 5h 30m   │
└──────────────┴────────┴───────────────────┘
```

## 요구사항

- Bun >= 1.0.0
- opencode-antigravity-auth 필요 (`~/.config/opencode/antigravity-accounts.json` 파일 필요)

## 기능

- 모든 Antigravity 계정의 쿼터 조회
- 모델별 그룹화 (gemini-3-pro, gemini, claude)
- 쿼터 잔량에 따른 색상 표시
  - 50% 이상: 초록색
  - 20% 이상: 노란색
  - 20% 미만: 빨간색
- Reset Time을 상대 시간으로 표시 (예: `in 4h 59m`, `in 6 days 23h 59m`)

## 라이선스

MIT
