#!/bin/bash

# Script to update BibTeX data from .bib file
# Usage: ./update-bibtex.sh

BIBTEX_FILE="assets/file/publication.bib"
JS_FILE="assets/js/publications-bibtex.js"

if [ ! -f "$BIBTEX_FILE" ]; then
    echo "Error: $BIBTEX_FILE not found!"
    exit 1
fi

echo "Updating JavaScript BibTeX data from $BIBTEX_FILE..."

# Create the JavaScript file with embedded BibTeX content
cat > "$JS_FILE" << 'EOF'
/**
 * Publications BibTeX Data
 * This file contains the BibTeX content as a JavaScript string to avoid CORS issues
 * 
 * To update this file:
 * 1. Edit assets/file/publication.bib
 * 2. Run: ./update-bibtex.sh
 * OR manually copy the content between the backticks below
 */

const BIBTEX_DATA = `EOF

# Add the BibTeX content
cat "$BIBTEX_FILE" >> "$JS_FILE"

# Close the JavaScript structure
cat >> "$JS_FILE" << 'EOF'
`;

// Export the data for use in other scripts
window.BIBTEX_DATA = BIBTEX_DATA;
EOF

echo "✅ Successfully updated $JS_FILE"
echo ""
echo "📝 To add new publications:"
echo "1. Edit $BIBTEX_FILE"
echo "2. Run this script again: ./update-bibtex.sh"
echo "3. Refresh your webpage"