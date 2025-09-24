/**
 * Publications Data Configuration
 * Automatically reads from publication.bib file
 */

// Configuration for file paths and external links
const CONFIG = {
    imageBasePath: 'assets/file/',
    defaultImage: 'images/pic01.jpg'  // Use existing image as default
};

/**
 * Enhanced BibTeX parser that handles custom fields
 */
function parseAdvancedBibTeX(bibtex) {
    console.log('Starting BibTeX parsing...');
    const entries = [];
    
    // Split entries by @ (but keep the @)
    const entryMatches = bibtex.split(/(?=@\w+\s*\{)/);
    console.log(`Found ${entryMatches.length} potential entries`);
    
    entryMatches.forEach((entry, index) => {
        if (!entry.trim() || !entry.includes('@')) {
            console.log(`Skipping entry ${index}: empty or no @ symbol`);
            return;
        }
        
        const data = {};
        
        // Extract entry type and key
        const entryMatch = entry.match(/@(\w+)\s*\{\s*([^,]+),/);
        if (entryMatch) {
            data.type = entryMatch[1].toLowerCase();
            data.key = entryMatch[2].trim();
            console.log(`Processing entry ${index}: ${data.type} - ${data.key}`);
        } else {
            console.log(`Could not extract type/key from entry ${index}`);
            return;
        }

        // Extract all fields (including custom ones)
        const fieldRegex = /(\w+)\s*=\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
        let match;
        while ((match = fieldRegex.exec(entry)) !== null) {
            const key = match[1].toLowerCase();
            const value = match[2].trim();
            data[key] = value;
        }

        if (data.title) {
            console.log(`Successfully parsed entry: ${data.title}`);
            entries.push(data);
        } else {
            console.log(`Entry ${index} has no title, skipping`);
        }
    });
    
    console.log(`Finished parsing, found ${entries.length} valid entries`);
    return entries;
}

/**
 * Convert BibTeX entry to publication object
 */
function convertBibTeXToPublication(entry) {
    // Determine category
    let category = 'research-papers';
    if (entry.type && (entry.type.includes('patent') || entry.type === 'patent')) {
        category = 'patents';
    }
    if (entry.type && entry.type === 'patent') {
        category = 'patents';
    }

    // Format authors with highlighted name
    const authors = formatAuthorsWithHighlight(entry.author || 'Unknown Author');
    
    // Format venue
    const venue = formatVenueFromBibTeX(entry);
    
    // Handle image/preview
    let image = CONFIG.defaultImage;
    if (entry.preview) {
        // Check if it's a URL or local file
        if (entry.preview.startsWith('http')) {
            image = entry.preview;
        } else {
            image = CONFIG.imageBasePath + entry.preview;
        }
    }
    
    // Handle links
    const links = {};
    if (entry.pdf) {
        links.pdf = entry.pdf.startsWith('http') ? entry.pdf : CONFIG.imageBasePath + entry.pdf;
    }
    if (entry.doi) {
        links.doi = entry.doi.startsWith('http') ? entry.doi : `https://doi.org/${entry.doi}`;
    }
    if (entry.url) {
        links.url = entry.url;
    }
    if (entry.poster) {
        links.poster = entry.poster.startsWith('http') ? entry.poster : CONFIG.imageBasePath + entry.poster;
    }
    if (entry.slides) {
        links.slides = entry.slides.startsWith('http') ? entry.slides : CONFIG.imageBasePath + entry.slides;
    }
    if (entry.video) {
        links.video = entry.video.startsWith('http') ? entry.video : CONFIG.imageBasePath + entry.video;
    }
    if (entry.code) {
        links.code = entry.code.startsWith('http') ? entry.code : CONFIG.imageBasePath + entry.code;
    }
    
    return {
        title: entry.title || 'Untitled',
        authors: authors,
        venue: venue,
        year: parseInt(entry.year) || new Date().getFullYear(),
        category: category,
        image: image,
        abstract: entry.abstract || '',
        keywords: entry.keywords || '',
        abbr: entry.abbr || '',
        selected: entry.selected === 'true',
        ...links
    };
}

/**
 * Format authors with name highlighting
 */
function formatAuthorsWithHighlight(authors) {
    if (!authors) return 'Unknown Author';
    
    return authors
        .split(' and ')
        .map(author => {
            // Clean up the author name
            let cleanAuthor = author.trim();
            
            // Handle "Last, First" format
            if (cleanAuthor.includes(',')) {
                const parts = cleanAuthor.split(',').map(p => p.trim());
                cleanAuthor = `${parts[1]} ${parts[0]}`;
            }
            
            // Highlight Zhe Liu
            if (cleanAuthor.toLowerCase().includes('zhe liu') || cleanAuthor.toLowerCase().includes('liu, zhe')) {
                return '<strong>Zhe Liu</strong>';
            }
            
            return cleanAuthor;
        })
        .join(', ');
}

/**
 * Format venue information from BibTeX entry
 */
function formatVenueFromBibTeX(entry) {
    if (entry.journal) {
        return entry.journal + 
               (entry.volume ? ` ${entry.volume}` : '') + 
               (entry.number ? `(${entry.number})` : '') +
               (entry.pages ? `: ${entry.pages}` : '') +
               (entry.year ? ` (${entry.year})` : '');
    } else if (entry.booktitle) {
        return entry.booktitle + (entry.year ? ` (${entry.year})` : '');
    } else if (entry.school) {
        return `${entry.school}${entry.year ? ` (${entry.year})` : ''}`;
    } else if (entry.organization) {
        return `${entry.organization}${entry.year ? ` (${entry.year})` : ''}`;
    }
    return 'Unknown Venue';
}

/**
 * Load publications from BibTeX file
 */
async function loadPublicationsFromFile() {
    const loadingElement = document.getElementById('publications-loading');
    
    try {
        // Show loading indicator
        if (loadingElement) {
            loadingElement.style.display = 'block';
            loadingElement.innerHTML = '<p>Loading publications...</p>';
        }
        
        // Load from the .bib file
        const response = await fetch('assets/content/publication.bib');
        if (!response.ok) {
            throw new Error(`Failed to load BibTeX file: ${response.status} ${response.statusText}`);
        }
        
        const bibtexContent = await response.text();
        console.log('Successfully loaded BibTeX file, parsing entries...');
        
        const entries = parseAdvancedBibTeX(bibtexContent);
        console.log(`Parsed ${entries.length} entries from BibTeX file`);
        
        // Clear existing publications
        pubManager.clear();
        
        // Convert and add each entry
        entries.forEach(entry => {
            const publication = convertBibTeXToPublication(entry);
            pubManager.addPublication(publication);
        });
        
        // Render all publications
        pubManager.renderPublications();
        
        // Hide loading indicator
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        console.log(`Successfully loaded and rendered ${entries.length} publications from BibTeX file`);
        
    } catch (error) {
        console.error('Error loading publications from file:', error);
        
        // Show error message to user
        if (loadingElement) {
            loadingElement.innerHTML = `
                <p style="color: #cb181d;">
                    Error loading publications: ${error.message}<br>
                    Please check that the file 'assets/content/publication.bib' exists and is accessible.
                </p>
            `;
        }
    }
}

/**
 * Fallback function for manual publication data (not used - keeping for reference)
 */
function loadFallbackPublications() {
    console.log('Fallback publications function called - no manual data configured');
    const loadingElement = document.getElementById('publications-loading');
    if (loadingElement) {
        loadingElement.innerHTML = '<p style="color: #cb181d;">No publication data available.</p>';
    }
}

// Load publications when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure all scripts are loaded
    setTimeout(loadPublicationsFromFile, 100);
});

// Helper function to add a new publication quickly
function addNewPublication(title, authors, venue, year, category = 'research-papers', links = {}) {
    pubManager.addPublication({
        title: title,
        authors: authors,
        venue: venue,
        year: year,
        category: category,
        image: links.image || 'assets/file/images/pic01.jpg',
        pdf: links.pdf,
        doi: links.doi,
        url: links.url,
        slides: links.slides,
        video: links.video,
        code: links.code,
        award: links.award
    });
    
    // Re-render publications
    pubManager.renderPublications();
}

// Example usage:
// addNewPublication(
//     "My New Paper Title",
//     "<strong>Zhe Liu</strong>, Co-author Name",
//     "Conference Name 2025",
//     2025,
//     'research-papers',
//     {
//         image: 'images/new-paper.jpg',
//         pdf: 'papers/new-paper.pdf',
//         doi: '10.1145/newpaper'
//     }
// );