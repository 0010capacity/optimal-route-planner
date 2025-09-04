📍 다중 경유지 최적 경로 안내 웹 앱

1. 프로젝트 소개
여러 장소를 방문해야 할 때, 수동으로 경로 순서를 바꿔보는 번거로움을 해결하기 위한 모바일 친화적 웹 애플리케이션입니다.

사용자가 출발지, 경유지, 도착지를 입력하면 최소 이동 시간을 기준으로 최적의 방문 순서를 자동으로 계산하고, 이를 네이버 지도 위에 시각적으로 보여줍니다. 이 프로젝트는 TSP(외판원 문제) 해결 알고리즘을 웹 환경에서 구현하여 사용자의 시간과 노력을 절약하는 것을 목표로 합니다.

2. 주요 기능
*   다중 경유지 추가: 방문하고자 하는 여러 장소를 자유롭게 추가하고 목록으로 관리할 수 있습니다.
*   장소 검색: 네이버 지역 검색(Local) API를 연동하여 편리하게 장소를 검색하고 추가할 수 있습니다.
*   자동 경로 최적화: 버튼 클릭 한 번으로 입력된 경유지들의 최적 방문 순서를 계산합니다. (출발지와 도착지는 고정)
*   네이버 지도 연동: 최적화된 경로를 네이버 지도 위에 Polyline으로 시각화하여 직관적으로 보여줍니다.
*   모바일 우선 디자인: 스마트폰 환경에서 최적의 사용자 경험을 제공하도록 반응형으로 디자인되었습니다.

3. 기술 스택
*   Frontend: React.js
*   Map: Naver Maps API (Web Dynamic Map, Geocoding, Directions 5)
*   Map Library: react-naver-maps
*   Deployment: Firebase Hosting
*   Package Manager: npm
*   Version Control: Git, GitHub

4. 프로젝트 설치 및 실행 방법

사전 요구 사항
*   Node.js 및 npm 설치
*   Firebase CLI 설치 (`npm install -g firebase-tools`)
*   네이버 클라우드 플랫폼 API Key 발급 (아래 'API 설정' 참고)

설치 과정
1.  **GitHub 저장소 복제(Clone)**
    ```bash
    git clone [https://github.com/](https://github.com/)[Your-Username]/[Your-Repository-Name].git
    cd [Your-Repository-Name]
    ```
2.  **패키지 종속성 설치**
    ```bash
    npm install
    ```
3.  **환경 변수 설정**
    프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 다음 내용을 추가합니다.
    네이버 클라우드 플랫폼에서 발급받은 Client ID와 Client Secret을 아래와 같이 입력합니다.
    ```
    REACT_APP_NAVER_CLIENT_ID=YOUR_NAVER_CLIENT_ID
    REACT_APP_NAVER_CLIENT_SECRET=YOUR_NAVER_CLIENT_SECRET
    ```
    *   `.env` 파일은 Git 저장소에 커밋되지 않도록 `.gitignore`에 추가해야 합니다.

4.  **개발 서버 실행**
    ```bash
    npm start
    ```
    브라우저에서 `http://localhost:3000` 주소로 접속하여 앱을 확인할 수 있습니다.

5. API 설정
본 프로젝트는 네이버 클라우드 플랫폼의 API를 사용합니다.

네이버 클라우드 플랫폼 콘솔에 로그인합니다.

AI·NAVER API > Application 등록 메뉴로 이동합니다.

아래 3개의 API를 사용하는 애플리케이션을 생성합니다.
*   Web Dynamic Map
*   Geocoding
*   Directions 5

Web 서비스 URL에 로컬 개발 환경 주소(`http://localhost:3000`)와 배포할 서비스의 URL을 등록해야 정상적으로 작동합니다.

6. 배포
이 프로젝트는 Firebase Hosting을 통해 배포됩니다.

1.  **프로젝트 빌드**
    ```bash
    npm run build
    ```
2.  **Firebase에 배포**
    ```bash
    firebase deploy
    ```
    배포가 완료되면 다음 URL에서 앱을 확인할 수 있습니다:
    `https://optimal-route-planner.web.app`
    
    배포 후 발급된 URL을 네이버 클라우드 플랫폼의 'Web 서비스 URL'에 추가해야 합니다.
