import sys
import importlib
import platform

REQUIRED_PACKAGES = [
    "fastapi",
    "uvicorn",
    "cv2",
    "numpy",
    "PIL",
    "torch",
    "torchvision",
    "moviepy",
    "soundfile",
    "psutil",
    "requests",
    "tqdm",
    "scipy",
    "skimage"
]

def check_packages():
    print("\n🔍 Checking required Python packages...\n")
    missing = []

    for pkg in REQUIRED_PACKAGES:
        try:
            importlib.import_module(pkg)
            print(f"✅ {pkg}")
        except ImportError:
            print(f"❌ {pkg} (missing)")
            missing.append(pkg)

    return missing


def check_cuda():
    print("\n🚀 Checking CUDA / GPU support...\n")
    try:
        import torch
        if torch.cuda.is_available():
            print("✅ CUDA AVAILABLE")
            print(f"   GPU: {torch.cuda.get_device_name(0)}")
            print(f"   CUDA Version: {torch.version.cuda}")
            return "GPU"
        else:
            print("⚠️ CUDA NOT AVAILABLE")
            print("   Running in CPU mode")
            return "CPU"
    except Exception as e:
        print("❌ PyTorch error:", e)
        return "CPU"


def system_info():
    print("\n🖥️ System Information\n")
    print(f"OS       : {platform.system()} {platform.release()}")
    print(f"Python   : {sys.version.split()[0]}")
    print(f"Arch     : {platform.machine()}")


def main():
    print("\n==============================")
    print(" Flood Predictor Environment Check ")
    print("==============================")

    system_info()
    missing = check_packages()
    mode = check_cuda()

    print("\n==============================")
    if missing:
        print("❌ Setup incomplete")
        print("Missing packages:")
        for m in missing:
            print(" -", m)
        print("\nRun:")
        print("pip install -r requirements.txt")
    else:
        print("✅ All required packages installed")
        print(f"🧠 Inference Mode: {mode}")

        if mode == "CPU":
            print("\n💡 Tip:")
            print("To enable GPU inference:")
            print("https://pytorch.org/get-started/locally/")
    print("==============================\n")


if __name__ == "__main__":
    main()
