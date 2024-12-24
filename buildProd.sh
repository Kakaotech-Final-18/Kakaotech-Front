#!/bin/bash

#####################
# 0.배포될 서버의 VITE 환경변수 미리 작성
#    ./env.development(개발) ./env.production(운영)
# 0. aws-cli 설치 후 aws configure에 계정 등록 및 ecr 권한 확인

# 1. 권한추가 
# chmod +x build.sh

# 2. 실행
# ./build.sh

# 필요시 아래 파일 수정 후 main에 바로 push
# Parrotalk-Manifests/apps/frontend
# 공통: base/configmap.yaml
# 환경별: overlays/[dev/prod]/configmap-patch.yaml 

# 3. argocd 들어가서 deployment > restart
#####################

set -e  # 오류 발생 시 스크립트 종료

# 현재 브랜치 확인
BRANCH=$(git rev-parse --abbrev-ref HEAD)
BRANCH=develop
if [[ "$BRANCH" != "main" && "$BRANCH" != "develop" ]]; then
    echo "현재 브랜치는 main 또는 develop이 아닙니다. 스크립트를 종료합니다."
    exit 1
fi

echo "운영빌드 현재 브랜치는 '$BRANCH'입니다."


    TAG="ptk-fe-prod"
    NODE_ENV="production"


# ECR 로그인
echo "ECR 로그인 중..."
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 703671911294.dkr.ecr.ap-northeast-2.amazonaws.com

# buildx 설정
echo "Docker buildx 설정 중..."
BUILDER_NAME="temp-builder-$(date +%s)"
docker buildx create --name $BUILDER_NAME --use || { echo "Docker buildx 생성에 실패했습니다."; exit 1; }

# 이미지 빌드 및 푸시
echo "이미지 빌드 및 푸시 중..."
docker buildx build \
 --platform linux/amd64 \
 -t 703671911294.dkr.ecr.ap-northeast-2.amazonaws.com/ptk-dev-ecr-argocd:$TAG \
 -f Dockerfile \
 --build-arg NODE_ENV=$NODE_ENV \
 --push \
 . || { 
   echo "이미지 빌드 및 푸시에 실패했습니다. buildx를 삭제하고 종료합니다."
   docker buildx rm $BUILDER_NAME
   exit 1; 
}

echo "이미지 빌드 및 푸시 완료. 태그: $TAG"

# buildx 삭제
echo "Docker buildx 정리 중..."
docker buildx rm $BUILDER_NAME || { echo "Docker buildx 삭제에 실패했습니다."; exit 1; }

echo "작업완료"
