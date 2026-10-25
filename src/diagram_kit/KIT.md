# 개념 도식 키트 (cloud CBT)

모든 그림은 **인라인 SVG 문자열**로 쓰고, 아래 클래스만 써서 색을 정해요 (색 리터럴은 되도록 쓰지 않기).
사이트가 `kit.css` 를 넣어 주고, 각 그림은 `<figure class="dg">` 안에 들어가요.

## 규칙
- `<svg viewBox="0 0 720 H" role="img" aria-label="그림이 보여 주는 주장">` — width/height 속성 없이 viewBox 만. **W 는 720 고정**, H 는 내용에 맞게 (보통 200~420).
- `<style>`, `<script>`, `<foreignObject>`, 외부 이미지 금지. 텍스트는 `<text>`, 기본 `class="t"` (13px). 짧게 (2~6단어). 설명 문장은 caption 으로.
- 키트가 `dominant-baseline: middle` 이라 `<text>` 의 y 는 글자 세로 가운데. 가운데 정렬은 `text-anchor="middle"`.
- 화살표: 각 SVG 안 `<defs>` 에 **섹션 id 가 들어간 고유 id** 로 marker 정의 (한 페이지에 그림이 여러 개라 id 가 겹치면 안 됨):
  `<marker id="ah-m7-igw" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="ah"/></marker>` — 강조용은 `class="ah-hl"` 로 marker 하나 더 (`ah-hl-m7-igw`).
- 화살표에 라벨을 붙이세요 (`요청`, `동기 복제`, `0.0.0.0/0 → IGW`).
- 10 단위 격자에 맞춰 정렬, 간격 일정. 글자가 상자 밖으로 나가거나 겹치지 않게 (한글 13px ≈ 글자당 13px 폭으로 계산).

## 클래스
| 용도 | 클래스 |
|---|---|
| 글자 | `t` 기본, `tb` 굵게, `ts` 작게·회색, `th` 제목, `tw` 흰 글자(서비스 칩 안), `to` 주황 강조, `tg` 초록(허용/정답), `tr` 빨강(거부/오답) |
| AWS 클라우드 / 리전 / AZ | `cloud`, `region`(청록 점선), `az`(파랑 점선) |
| VPC / 퍼블릭 서브넷 / 프라이빗 서브넷 | `vpc`(보라 실선), `pub`(연두), `priv`(하늘) |
| 일반 상자 / 회색 바탕 / 강조 / 좋음 / 나쁨 | `box`, `soft`, `hl`, `ok`, `bad` |
| 서비스 칩 (rect rx=6) | `svc` + 분류: `compute`(EC2·Lambda·Auto Scaling), `storage`(S3·EBS·EFS), `database`(RDS·Aurora·DynamoDB), `network`(VPC·IGW·NAT·ELB·CloudFront·Route 53), `security`(IAM·KMS·WAF), `integration`(SQS·SNS), `mgmt`(CloudWatch·CloudTrail·Organizations), `user`(사용자·인터넷·온프레미스), `generic` |
| 선 | `ln` 기본, `ln-hl` 강조(주황), `ln-ok`, `ln-bad`, 점선은 `dash` 추가 |
| 화살촉 path | `ah`, `ah-hl`, `ah-ok`, `ah-bad` |

서비스 칩 예: `<rect class="svc compute" x="40" y="60" width="96" height="34" rx="6"/><text class="tw" x="88" y="77" text-anchor="middle">EC2</text>`

## 출력 형식
`[{ "id": "m7-igw", "figs": [ { "svg": "<svg ...>...</svg>", "caption": "그림이 보여 주는 내용 한 문장" } ] }, ...]` — id 는 개념 섹션 id.

## 미리보기 (반드시 눈으로 확인)
`python preview.py <diagrams.json> <out.png> [--ids=m7-igw,m7-nat]` → 그림을 한 페이지에 그려 크롬으로 캡처. PNG 를 Read 로 열어 겹침·잘림·정렬을 확인하고 고치세요. 한 번에 4~6개씩 보는 게 잘 보여요. 참고 샘플: `sample.json`.
