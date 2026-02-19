# Project Q&A Website Walkthrough

I have successfully built the Q&A website for the "2026 마음치유, 봄처럼" project. This website allows you to search through the project documents easily.

## Features
-   **AI Answer Engine**: Uses OpenAI (GPT-4o) to summarize answers from project documents.
-   **Context-Aware**: Understands questions like "Is it difficult?" based on project tone.
-   **Smart Search**: Finds relevant text chunks even if keywords don't match exactly.
-   **Secure**: API Keys are stored locally in your browser, not on a server.
- **Smart Search**: Enter keywords to find relevant sections from the project documents.
- **Contextual Results**: Shows the text surrounding your search terms with highlighting.
- **Tag Search**: Click on popular tags like #예산, #신청자격 to quickly search.
- **Responsive Design**: Works on desktop and mobile with a beautiful, modern interface.

## How to Use
1.  **Open the Website**: Double-click on `index.html` in the folder `c:\Users\kyh94\OneDrive\Desktop\마음치유, 봄처럼`.
2.  **Set Up AI (One Time)**:
    -   Click the **⚙️ 설정** button in the top right.
    -   Enter your **Google Gemini API Key** (starts with `AIzaSy...`).
    -   Click "Save". The key is stored safely in your browser.
3.  **Ask a Question**:
    -   Type a question like "지원 자격이 어떻게 되나요?" or click one of the **Recommended Buttons**.
    -   The AI will read the relevant documents and provide a summary answer using Gemini 1.5 Flash/Pro.
    -   You can also see the exact source text in the cards below.

## Technical Details
- **Data Extraction**: The `build_data.ps1` script extracts text from `.hwpx` files and saves it to `data.js`.
- **Frontend**: Pure HTML, CSS, and JavaScript. No server required.
- **Data**: All project data is loaded locally from `data.js`.

## Maintenance
If you add new `.hwpx` files to the folder, you can regenerate the data by running the `build_data.ps1` script:
1.  Right-click `build_data.ps1` and select "Run with PowerShell".
2.  Refresh the `index.html` page in your browser.

## Files
- `index.html`: Main website entry point.
- `style.css`: Styles and design.
- `script.js`: Search logic and interactivity.
- `data.js`: Extracted text content from documents.
- `build_data.ps1`: Script to update `data.js` from `.hwpx` files.
