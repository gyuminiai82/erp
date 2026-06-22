from PIL import Image
import sys

def make_seal_transparent_and_crop(input_path, output_path):
    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()
        
        newData = []
        for r, g, b, a in datas:
            ink_intensity = 255 - (g + b) / 2
            
            new_a = int(ink_intensity)
            if new_a < 70:
                new_a = 0
                
            newData.append((180, 20, 20, new_a))
            
        img.putdata(newData)
        
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
            
        img.save(output_path, "PNG")
        print("Successfully made the seal transparent and cropped.")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    make_seal_transparent_and_crop(r"d:\erp\public\images\company_seal.png", r"d:\erp\public\images\company_seal.png")
