import os
import json
import re

def extract_clean_text(stream):
    """Very basic extraction of ( ) blocks from PDF stream."""
    text = ""
    # Look for (TEXT) and Tj/TJ patterns
    # This is a VERY simplified heuristic
    matches = re.findall(r'\((.*?)\)\s*Tj', stream)
    for m in matches:
        text += m + " "
    return text

def pure_python_pdf_extract(path):
    """Reads PDF raw bytes and tries to find page objects and text segments."""
    try:
        with open(path, 'rb') as f:
            data = f.read()
            
        # Find /Type /Page objects
        page_splits = re.split(r'/Type\s*/Page', data.decode('latin-1', errors='ignore'))
        content_with_pages = ""
        
        for i, page_blob in enumerate(page_splits[1:]): # Skip pre-first-page
            # Try to find text within the page blob
            # Note: This is a fallback and will NOT handle complex encoding/compression
            # but usually '공모' guidance PDFs have some uncompressed streams or simple ones.
            page_text = extract_clean_text(page_blob)
            if not page_text or len(page_text.strip()) < 10:
                # If no Tj found, just grab any Latin/Korean ASCII-plus-ish sequences
                page_text = "".join(re.findall(r'[가-힣\s\w\.,!?-]+', page_blob))
            
            page_text = re.sub(r'\s+', ' ', page_text).strip()
            if len(page_text) > 20: # Sanity check for empty/garbage pages
                content_with_pages += f"[PAGE:{i+1}] {page_text} "
        
        return content_with_pages
    except Exception as e:
        print(f"Pure Python extraction failed: {e}")
        return ""

def extract_pdf_with_pages(directory):
    pdf_files = [f for f in os.listdir(directory) if f.endswith('.pdf')]
    combined_data = []

    for filename in pdf_files:
        path = os.path.join(directory, filename)
        print(f"Processing {filename}...")
        
        try:
            content_with_pages = pure_python_pdf_extract(path)
            
            if not content_with_pages:
                # Last resort: just dump anything that looks like text
                with open(path, 'rb') as f:
                    raw = f.read().decode('latin-1', errors='ignore')
                    content_with_pages = "".join(re.findall(r'[가-힣\w\s\.,]{20,}', raw))

            combined_data.append({
                "filename": filename,
                "content": content_with_pages.strip()
            })
        except Exception as e:
            print(f"Error processing {filename}: {e}")

    return combined_data

def main():
    target_dir = os.getcwd()
    data = extract_pdf_with_pages(target_dir)
    
    # Write to data.js
    json_data = json.dumps(data, ensure_ascii=False)
    js_content = f"window.PROJECT_DATA = {json_data};"
    
    output_path = os.path.join(target_dir, "data.js")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"Successfully created data.js with {len(data)} PDF files.")

if __name__ == "__main__":
    main()
