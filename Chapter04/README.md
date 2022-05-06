# 트러플(truffle)을 사용한 Dapp 개발
  
## 트러플(truffle)
  
트러플은 **통합 Dapp 개발 환경과 테스팅 프레임워크를 제공하는 도구**  
이더림운 기반 종단 Dapp 개발을 위한 여러가지 기능과 명령어를 제공하는데, 다음과 같은 것을 포함한다.
 - `truffle init`: Dapp을 위한 템플릿, 즉 기본 디렉터리 구조 생성
 - `truffle compile`: 스마트 컨트랙트를 컴파일하고 배포
 - `truffle develop`: 콘솔에서 테스트를 하기 위한 개인 블록체인 론칭
 - `truffle migrate`: 스마트 컨트랙트를 배포하기 위한 마이그레이션 스크립트(migration script) 실행
 - `truffle console`: Dapp UI 없이 테스팅하기 위한 커맨드 라인 인터페이스(CLI)를 트러플에 오픈
 - `truffle test`: 배포된 컨트랙트를 테스팅
  
리믹스 IDE의 경우 **스마트 컨트랙트를 개발하기 위한 환경**이며, 트러플의 경우 **Dapp 개발을 프로덕션 수준으로** 이끈다.  
트러플 툴셋(IDE)은 스크립팅을 통한 컨트랙트 배포 처리, 스마트 컨트랙트 스테이징을 위한 마이그레이션 프레임워크를 제공하며, 이식성(portability)과 통합(integraion)을 위한 패키지 관리 기능도 제공한다.

### 개발 과정
  
트러플을 사용한 Dapp 개발과정은 다음과 같은 주요 단계를 밟아 가면 된다.  

1. 문제 설정 분석 - 설계 원칙과 UML 다이어그램을 이용해 솔루션을 설계하고 표현
2. 리믹스 웹 IDE를 사용해 스마트 컨트랙트를 개발하고 테스트
3. 트러플 IDE를 사용해 종단 간 Dapp을 코딩하고 테스트 블록체인에 배포해 테스트하고 메인 네트워크에 마이그레이션

### 트러플 설치

트러플을 사용한 Dapp 개발을 위해 다음과 같은 것들이 필요하다.  
 - OS - 리눅스 우분투 18.04, macOS(시에라 또는 이후 버전), 윈도우 10 이상
 - 클라이언트 인터페이스를 위한 웹서버 - Node.js v12.16.0 이상
 - 패키지 매니저 - npm 6.13 이상
 - IDE - 트러플 5.1.X 이상
 - 스마트 컨트랙트 언어 툴체인 - 솔리디티(solidity) 0.5.16 이상(트러플 툴셋에 따라옴)
 - 브라우저/웹 클라이언트 - 크롬과 메타마스크(LTS) 플러그인
 - 에디터 - Atom, gedit, VSCode 또는 선호하는 에디터

트러플 설치는 아래 명령어로 설치한다.  
```
npm install -g truffle
```
만일 버전 호환성으로 인해 오류가 발생하면, nodeLTS 버전으로 시도한다.
```
npm uninstall -g truffle
npm install -g truffle@nodeTLS
```
설치한 소프트웨어의 버전을 다음의 명령어로 확인할 수 있다.
```
truffle version
```
그럼 다음처럼 버전 정보가 나온다.(버전 정보는 바뀔 수 있다.)
```
Truffle v5.5.12 (core: 5.5.12)
Ganache v^7.1.0
Solidity v0.5.16 (solc-js)
Node v14.16.0
Web3.js v1.5.3
```

## 가나쉬(ganache) 테스트 체인 설치

블록체인 레이어를 설정하는 방법에는 리믹스 IDE에서 사용한 시뮬레이팅된 VM에서 시작해 본격적인 Geth(Go Ethereum) 클라이언트에 이르기까지 여러 옵션이 있다.  
여기에서는 가나쉬라고 불리는 트러플 스위트의 테스트 블록체인을 사용할 것이다.  
가니쉬 설치는 아래 URL에 들어가 다운로드 받고 설치하면 된다.  
  
https://trufflesuite.com/ganache/  
  
가나쉬는 **이더리움 클라이언트로 디폴트로 로컬 호스트에서 실행하도록 설정**되어 있다. 10 개의 테스트 어카운트(account)를 제공하고, 각 어카운트는 테스트용 100 이더씩을 가지고 있다. 이를 이용해 필요한 가스비(gas fee)를 지금하고 어카운트 간에 이더를 이전시켜 볼 수도 있다.  
가니쉬의 블록체인 인터페이스 상단 쪽에 시드 단어 또는 니모닉(mnemonics)이 있는데, 이를 복사해서 다른 곳에 저장해두는 것이 좋다. 나중에 Dapp을 테스트할 때 체인에 액세스하기 위한 인증에 필요하다.

## 프로젝트 폴더 만딜기

가장 먼저 할 일은 컨트랙트를 담을 포준화 디렉터리 구조를 만들고 초기화하는 것이다. 트러플은 이러한 구조를 가진 디렉터리 템플릿을 제공한다. 기본 프로젝트 구조를 초기화하기 위해서는 다음의 명령어를 실행시키면 된다.
```
truffle init
```
그럼 다음과 같이 디렉터리 템플릿이 생성된다.
```
contracts migrations test truffle-config.js
```
위의 생성된 디렉토리와 파일은 다음과 같은 기능을 한다.
 - contracts/ - 스마트 컨트랙트를 위한 솔리디티 소스 파일. `Migrations.sol`이라는 매우 중요한 켄트랙트도 여기에 있다. 이 스마트 컨트랙트는 프로젝트의 다른 스마트 컨트랙트 배포를 쉽게하는 스크립트를 가지고 있다.
 - migrations/ - 트러플은 스마트 컨트랙트의 배포를 위해 마이그레이션 시스템을 사용한다. 마이그레이션은 (자바스크립트로 작성된) 추가적인 스크립트로서, 개발 중인 스마트 컨트랙트의 변화를 관리한다.
 - test/ - 스마트 컨트랙트를 위한 자바스크립트와 솔리디티 테스트
 - truffle-config.js - 프러플 설정 파일인데, 여기에는 블록체인 네트워크 ID, IP, RPC 포트 번호 같은 설정 정보가 들어 있다.