# Publications Management System

This system automatically reads your publications from BibTeX data and generates beautiful publication cards.

## ⚠️ Important: CORS Solution

Due to browser security restrictions, the system cannot directly read `.bib` files when opening HTML files locally. Instead, we embed the BibTeX data in a JavaScript file.

## 🚀 How to Add/Update Publications

### Method 1: Direct JavaScript Edit (Recommended)
1. **Edit the data**: Open `assets/js/publications-bibtex.js`
2. **Update the BibTeX**: Modify the content between the backticks
3. **Refresh page**: Publications load automatically

### Method 2: Using the Update Script (Mac/Linux)
1. **Edit BibTeX file**: Modify `assets/file/publication.bib`
2. **Run update script**: `./update-bibtex.sh`
3. **Refresh page**: Publications load automatically

### Method 3: Manual Copy-Paste
1. **Edit your .bib file**: Use any text editor or reference manager
2. **Copy the content**: Select all BibTeX entries
3. **Paste into JavaScript**: Replace content between backticks in `assets/js/publications-bibtex.js`
4. **Refresh page**: Publications load automatically

## Supported BibTeX Fields

### Standard Fields
- `title` - Publication title
- `author` - Authors (automatically highlights "Zhe Liu")
- `year` - Publication year
- `journal` - Journal name
- `booktitle` - Conference/book title
- `organization` - Publishing organization

### Custom Fields
- `type` - Set to "patent" for patents, anything else for research papers
- `preview` - Image filename or URL for the publication
- `pdf` - PDF link (URL or local file path)
- `poster` - Poster link (URL or local file path)
- `slides` - Slides link (URL or local file path)
- `video` - Video link (URL or local file path)
- `code` - Code repository link
- `doi` - DOI (will be converted to URL automatically)
- `abbr` - Conference/journal abbreviation (displayed as badge)
- `selected` - Set to "true" to highlight important publications
- `award` - Award text (displayed with trophy icon)

## File Organization

### Images
- **External URLs**: Full URLs starting with `http://` or `https://`
- **Local files**: Place in `assets/file/` folder and reference by filename only
- **Default image**: Uses `images/pic01.jpg` if no preview specified

### Links (PDF, Slides, etc.)
- **External URLs**: Full URLs starting with `http://` or `https://`
- **Local files**: Place in `assets/file/` folder and reference by filename only

## Example BibTeX Entry

```bibtex
@inproceedings{liu2025ai,
    title={Real-time AI Assistance for Semi-structured Interviews},
    author={Liu, Zhe and McGrenere, Joanna and Vogel, Daniel},
    booktitle={Proceedings of the 2025 CHI Conference on Human Factors in Computing Systems},
    year={2025},
    organization={ACM},
    pdf={https://dl.acm.org/doi/abs/10.1145/example},
    poster={my_poster.pdf},
    preview={ai_interview_thumbnail.jpg},
    abbr={CHI},
    selected={true},
    award={Best Paper Award},
    type={paper}
}
```

## Adding New Publications

### Quick Method (Recommended):
1. **Open**: `assets/js/publications-bibtex.js`
2. **Add your BibTeX entry** within the backticks section
3. **Save and refresh** the webpage

### Alternative Method:
1. **Edit**: `assets/file/publication.bib` (if you prefer separate file)
2. **Run**: `./update-bibtex.sh` (copies .bib content to JavaScript file)
3. **Refresh** the webpage

## Troubleshooting

### Publications not loading?
- Check that `assets/file/publication.bib` exists and is accessible
- Verify BibTeX syntax (missing braces, commas, etc.)
- Check browser console for error messages

### Images not showing?
- Verify image paths (use filename only for local files)
- Check that images exist in `assets/file/` folder
- Ensure image filenames match exactly (case-sensitive)

### Links not working?
- Use full URLs for external links (`https://...`)
- Use filename only for local files in `assets/file/`
- Check that files exist and are accessible

## Configuration

Edit `CONFIG` object in `assets/js/publications-data.js`:

```javascript
const CONFIG = {
    bibFile: 'assets/file/publication.bib',    // Path to BibTeX file
    imageBasePath: 'assets/file/',             // Base path for local images
    defaultImage: 'images/pic01.jpg'           // Default image if none specified
};
```

## File Structure

```
assets/
├── file/
│   ├── publication.bib          # Your BibTeX file
│   ├── image1.jpg              # Publication images
│   ├── paper1.pdf              # Local PDF files
│   └── slides1.pdf             # Local presentation files
├── css/
│   └── publications.css         # Publication styling
└── js/
    ├── publications.js          # Core publication system
    └── publications-data.js     # BibTeX loader and configuration
```

## Advanced Usage

### Filtering Publications
The system supports filtering by adding these properties to the `CONFIG` object:

```javascript
const CONFIG = {
    // ... existing config
    showSelected: true,     // Only show selected publications
    maxPerYear: 5,         // Limit publications per year
    categories: ['paper']   // Filter by type
};
```

### Custom Styling
Selected publications automatically get special styling. You can customize in `publications.css`:

```css
.publication-selected {
    border-left: 4px solid #B9D9EB;
    background: #f9f9f9;
}
```