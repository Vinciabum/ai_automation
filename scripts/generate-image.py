#!/usr/bin/env python3
"""이미지 생성 스크립트 - imagen-4.0-fast-generate-001"""
import sys
import os
from pathlib import Path

# .env 파일 명시적 로드 (시스템 환경변수보다 .env 우선)
_env_path = Path(__file__).parent.parent / ".env"
if _env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(_env_path, override=True)

def main():
    if len(sys.argv) < 3:
        print("Usage: python generate-image.py <prompt> <output_path>", file=sys.stderr)
        sys.exit(1)

    prompt = sys.argv[1]
    output_path = sys.argv[2]

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)

    model = os.environ.get("GEMINI_IMAGE_MODEL", "imagen-4.0-fast-generate-001")
    response = client.models.generate_images(
        model=model,
        prompt=prompt,
        config=types.GenerateImagesConfig(number_of_images=1)
    )

    image_bytes = response.generated_images[0].image.image_bytes

    if not image_bytes:
        print("ERROR: no image in response", file=sys.stderr)
        sys.exit(1)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(image_bytes)

    print(output_path)

if __name__ == "__main__":
    main()
