from PIL import Image
import os

def convert_png_to_ico(png_path, ico_path):
    if not os.path.exists(png_path):
        print(f"Error: {png_path} not found.")
        return False
    
    img = Image.open(png_path)
    # 実行ファイルのアイコンとして一般的なサイズ（16, 32, 48, 256など）を含める
    icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128)]
    img.save(ico_path, format='ICO', sizes=icon_sizes)
    print(f"Successfully converted {png_path} to {ico_path}")
    return True

if __name__ == "__main__":
    convert_png_to_ico("icon128.png", "icon.ico")
