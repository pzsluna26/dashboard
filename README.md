
### 👩🏻‍⚖️ [2025 AI DATA 경진대회 ] 뉴스 및 소셜 데이터를 활용한 AI 입법 수요 분석 서비스 개발

    - 대회일정: 2025. 07.14(월) ~ 12. 03(수)
    - 주최: 국가과학기술연구회, 대전광역시, 해양경찰청, 국회도서관, 대전중구청
    - 주관: 한국과학기술정보연구원(KISTI)
    - 후원: (사)한국콘텐츠학회
    - 주제: 뉴스 및 소셜 데이터를 활용한 AI 입법 수요 분석 서비스 모델 개발


</br>

## 📽️ 시연영상

https://youtu.be/rvLSk8aTsyQ

</br>

## 📸 프로젝트 미리보기
![프로젝트 미리보기](./public/preview/dashboard.png)
- KPI Summary
    -  사용자 지정 기간 단위로 뉴스/여론 지표 누적 추이 시각화
    -  Recharts AreaChart 기반의 시계열 그래프 구성
-LegalTop5
    -  여론분포(개정강화/폐지완화/현상유지) 중 가장 뜨거운 관심을 받은 상위 5개 법조항 기준으로 시각화
    -  자동 슬라이드 애니메이션으로 랭킹 순위 강조
- NetworkGraph
    -  법조항-사건 관계를 2D 네트워크 그래프로 표시
    -  React-force-graph-2d 의 Force Simulation 으로 노드 간 관계를 동적으로 표현
- SocialBarChart
    -  법안별 여론 입장(개정강화/폐지완화/현상유지)을 누적 막대그래프로 표시
    -  비율/건수 모드를 토글하여 시각화 방식 전환 가능
- LegislativeStanceArea
    -  기간별 여론성향의 비율 변화를 시계열 면적 그래프로 시각화
    -  Highcharts의 Percent Stacked Area Chart를 활용하여 각 입장의 상대적 비중 변화를 직관적으로 표현
    -  useMEmo로 증감률 및 요약 인사이트를 계산하여 렌더링 성능을 최적화
    -  차트 하단에는 항목별 증감률 및 주요 인사이트를 텍스트로 요약 표시
- Heatmap
    -   법안별 입장 분포를 색상강도로 시각화
    -  HighCharts  Heatmap 모듈 기반

</br>

## 🕰️ 프로젝트 기간 및 인원
 
- 일정: 2025.08.29 - 2025.11.10 (총 12주)
- 인원: 4명 

</br>

## 📝 프로젝트 개요
1. 배경 및 필요성 </br>
    - 산업 영역: 입법 기관 및 정책 수립 지원
    - 주요 니즈(Pain Point): 데이터 홍수 속 정보 빈곤
        - 방대한 비정형 여론 데이터의 체계적 수렴 및 분석 부재
        - 실시간 사회 이슈 및 관련 입법 수요 파악의 어려움
    - 핵심가치: 주관적 판단이나 일부 목소리에 의존하던 기존 방식을 넘어, 객관적인 데이터 분석을 통해 국민의 의견을 신속하고 정확하게 정책에 반영하는 기술적 토대를 마련한다
2. 목표 </br>
    - 뉴스 데이터 구조화 및 핵심 이슈 자동 탐지
        - 뉴스 기사를 AI 모델로 분석하여 대분류>중분류 순으로 자동분류
        - 분류된 중분류 내에서 의미 기반 클러스터링을 통해 구체적인 이슈(소분류) 탐지
    - 이슈-법률 자동 매핑 및 여론 심층 분석
        - 탐지된 이슈의 대표 기사를 RAG 모델에 입력하여 관련 법 조항을 자동으로 매핑 
        - 해당 이슈에 대한 댓글을 '개정 강화', '폐지/완화', '현상 유지', '중립'의 4가지 입장으로 심층 분류
    - 객관적 중요도 산정 및 시각화
        - 미디어 지표와 대중 반응 지표를 종합한 다각적 평가지표(IIS)를 기반으로 사회적 중요도를 산정하여 Top-5 핵심 법안을 도출
        - 분석 결과를 사용자가 직관적으로 파악할 수 있는 웹 대시보드로 제공


</br>

## 👩🏻‍🎨 역할 및 상세내용
- 역할: 프론트엔드
    - #### 이상 이벤트(급증, 급감 등)결과의 실시간 시각화
        - 백엔드에서 전달되는 이상탐지 결과(법안 관련 뉴스·댓글 등)를 실시간 수집하여 그래프와 차트 형태로 표현
        - 이상 이벤트(급증, 급감 등)는 색상 변화나 애니메이션으로 시각적 강조
    - #### 대시보드 기반 통합 분석 뷰 제공
        - KPI, 법안별 랭킹, 연결망(Network Graph), 사회 여론 비율(Social Bar), 히트맵(Heatmap) 등 다양한 분석 지표를 한 화면에서 확인 가능
        - 각 위젯은 독립적으로 데이터 로딩·렌더링되어 사용자가 직관적으로 비교 및 탐색 가능 
    - #### 기간 선택 및 필터링 기능
        - 사용자가 조회 기간을 선택하면 즉시 해당 기간의 데이터로 전체 대시보드가 갱신
        - 모든 시각화 컴포넌트가 makeDefaultRange 함수를 통해 계산된 기본기간(start~end)상태를 공유하여 동적으로 렌더링
        - 백엔드 분석 서버와 REST API 연동을 통해 실시간 및 주기적 데이터 동기화 수행
    - #### 데이터 중심의 시각적 인터랙션 제공
        - 각 차트 요소에 마우스 오버, 클릭 등의 인터랙션을 제공하여 세부 데이터 탐색 가능
        - 툴팁, 범례 기능을 통해 사용자의 데이터 이해도 향상
    - #### 반응형 UI 구성 및 접근성 고려
        - 다양한 해상도(모니터, 노트북, 태블릿)에서도 대시보드 구성이 깨지지 않도록 반응형 레이아웃 구현
        - 컬러 대비, 텍스트 크기, hover 효과 등을 통해 데이터 인지성 강화
    - #### 동적 렌더링 및 성능 최적화
        - next/dynamic으로 그래프, 차트, Force-Graph와 같은 무거운 컴포넌트 lazy load

</br>


## 💡 문제 해결 사례 (프론트엔드)
- #### 렌더링 지연 문제 </br>
    : 대시보드 초기 렌더링 시 전체 JSON 데이터를 한 번에 불러오면서 화면이 지연되는 현상이 발생했습니다.
    컴포넌트 단위별로 필요한 데이터만 비동기로 호출하도록 API 구조를 수정하고,
    React의 Suspense와 useMemo를 활용해 불필요한 리렌더링을 최소화했습니다.
    그 결과, 주요 그래프 컴포넌트의 초기 렌더링 속도를 개선했습니다.
- #### 여론 분포 시각화 비율 불균형 문제 </br>
    : 백엔드에서 전달된 데이터의 중립 비율이 과도하게 높아 차트가 시각적으로 왜곡되었습니다.
    데이터 분석 의도를 고려해 프론트엔드에서 시각화 대상 데이터를 동적으로 필터링하도록 처리했습니다.
    즉, ‘찬성·반대’ 항목만을 차트 데이터로 반영해 사용자가 의도를 직관적으로 이해할 수 있도록 개선했습니다.
- #### 연결망 그래프 커스텀 이슈 </br>
    : Force-Graph 라이브러리를 활용한 네트워크 그래프에서
    법조항 노드와 사건명 노드 간의 엣지가 올바르게 연결되지 않는 문제가 발생했습니다.
    이를 해결하기 위해 데이터 키 매핑 구조를 점검하고, 커스텀 force simulation 로직을 적용하여
    노드 간 관계가 시각적으로 정확히 표현되도록 수정했습니다.
- #### 데이터 품질 이슈로 인한 시각화 방향 전환 </br>
    : 초기에는 뉴스/소셜 데이터를 동일한 분류 체계로 시각화하려 했지만,
    소셜 데이터의 광고성 콘텐츠로 인해 통계적 왜곡이 발생했습니다.
    이에 프론트엔드에서는 데이터 소스 변경(댓글 크롤링 데이터) 이후에도 동일한 시각화 구조를 재사용할 수 있도록 컴포넌트 구조를 유연하게 설계하여,
    분석 데이터 변경에도 UI 수정이 최소화되도록 했습니다.
- #### 데이터 연동 지연으로 인한 개발 대체 전략 </br>
    : 실제 API가 완성되기 전까지는 데이터 구조가 확정되지 않아 개발 테스트가 어려웠습니다.
    이를 해결하기 위해 Jupyter Notebook에서 생성한 더미 데이터와 Mock 데이터를 병행 사용,
    fetch 로직을 임시 모듈화하여 API 연동 없이도 UI를 완성도 있게 검증할 수 있도록 했습니다.
    이 과정에서 백엔드와의 데이터 스키마 협업 효율이 향상되었습니다.


</br>

## 🔧 개발 환경
- 개발환경
    - 프레임워크: Next.js (React 18, TypeScript)
    - 렌더링: 클라이언트 사이드 렌더링(CSR, Client-Side Rendering)
    - 효과: 사용자 상호작용 시 빠른 화면 전환 및 부드러운 인터페이스 제공

</br>

## ⚙️ 기술 스택
![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) ![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)

</br>

## 🧬 프로젝트 구조
```
 src/
 ├─ app/
 │   └─ page.tsx
 │
 ├─ features/
 │   └─ total/
 │       ├─ components/
 │       │   ├─ KpiSummary.tsx
 │       │   ├─ LegalTop5.tsx
 │       │   ├─ NetworkGraph.tsx
 │       │   ├─ NetworkGraphContainer.tsx
 │       │   ├─ SocialBarChart.tsx
 │       │   ├─ LegislativeStanceArea.tsx
 │       │   └─ Heatmap.tsx
 │       └─ hooks/
 │           ├─ useKpiSummary.ts
 │           ├─ useLegalTop5.ts
 │           ├─ useNetworkGraph.ts
 │           ├─ useSocialBar.ts
 │           ├─ useStanceArea.ts
 │           └─ useHeatmap.ts
 │
 ├─ shared/
 │   ├─ api/
 │   │   ├─ client.ts
 │   │   └─ dashboard.ts
 │   ├─ constants/
 │   │   └─ mapping.ts
 │   ├─ types/
 │   │   ├─ common.ts
 │   │   └─ dashboard.ts
 │   └─ utils/
 │       ├─ date.ts
 │       ├─ format.ts
 │       └─ insights.ts
 │
 └─ shared-ui/
     └─ HalfPieChart.tsx 
```
</br>

## 🔗 코드 및 리소스 링크
- FrontEnd
https://github.com/pzsluna26/dashboard.git
- Backend
https://github.com/Young6575/Dashboard-Backed.git
https://github.com/Young6575/Dashboard-backed_security.git
- DataAnalysis
https://github.com/heeaayoon/data
    
</br>