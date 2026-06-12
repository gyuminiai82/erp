# FastAPI 모듈에서 FastAPI 클래스를 가져옵니다.
# FastAPI는 파이썬 기반의 빠르고 현대적인 웹 프레임워크입니다.
from fastapi import FastAPI

# FastAPI 애플리케이션의 인스턴스를 생성합니다.
# 이 'app' 객체가 전체 웹 애플리케이션의 중심 역할을 하며, 라우팅 및 서버 설정의 기준이 됩니다.
app = FastAPI()

# HTTP GET 요청을 처리하는 라우팅 데코레이터입니다.
# 클라이언트(웹 브라우저나 프론트엔드 등)가 "/api/hello" 경로로 GET 요청을 보내면 아래 정의된 함수가 실행됩니다.
@app.get("/api/hello")
def read_root():
    # 클라이언트에게 반환할 데이터입니다.
    # 파이썬의 딕셔너리(Dictionary) 형태로 반환하면, FastAPI가 이를 자동으로 JSON 형식으로 변환하여 응답합니다.
    return {"message": "Hello from Python FastAPI Backend!"}
