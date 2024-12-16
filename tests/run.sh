#!/bin/bash

# 실행 권한 확인 및 부여
if [ ! -x "$0" ]; then
    chmod +x "$0"
fi

# 명령어 확인
if [ "$1" != "start" ]; then
    echo "Usage: ./run.sh start [test-file]"
    exit 1
fi

# node_modules 경로 확인
if [ ! -d "../../node_modules" ]; then
    echo "Error: node_modules not found. Please run npm install first."
    exit 1
fi

# Playwright 설치 확인
if [ ! -d "../../node_modules/@playwright" ]; then
    echo "Installing Playwright..."
    npm init playwright@latest
fi

# 테스트 실행
if [ -z "$2" ]; then
    # 전체 테스트 실행
    echo "Running all E2E tests..."
    npx playwright test specs/
else
    # 특정 테스트 실행
    if [ -f "specs/$2" ]; then
        echo "Running test: $2"
        npx playwright test "specs/$2"
    else
        echo "Error: Test file 'specs/$2' not found"
        exit 1
    fi
fi