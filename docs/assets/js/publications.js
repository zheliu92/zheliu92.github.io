/**
 * Publications Management System
 * Automatically generates publication cards from structured data
 */

class PublicationManager {
    constructor() {
        this.publications = {
            'research-papers': {},
            'patents': {}
        };
    }

    /**
     * Add a publication from BibTeX-like data
     * @param {Object} pubData - Publication data object
     */
    addPublication(pubData) {
        const category = pubData.category || 'research-papers';
        const year = pubData.year || new Date().getFullYear();
        
        if (!this.publications[category]) {
            this.publications[category] = {};
        }
        
        if (!this.publications[category][year]) {
            this.publications[category][year] = [];
        }
        
        this.publications[category][year].push(pubData);
    }

    /**
     * Parse BibTeX entry and add to publications
     * @param {string} bibtex - BibTeX string
     * @param {Object} metadata - Additional metadata (image, links, etc.)
     */
    addFromBibTeX(bibtex, metadata = {}) {
        const parsed = this.parseBibTeX(bibtex);
        const pubData = {
            ...parsed,
            ...metadata,
            category: metadata.category || 'research-papers'
        };
        this.addPublication(pubData);
    }

    /**
     * Simple BibTeX parser
     * @param {string} bibtex - BibTeX string
     * @returns {Object} Parsed publication data
     */
    parseBibTeX(bibtex) {
        const data = {};
        
        // Extract entry type and key
        const entryMatch = bibtex.match(/@(\w+)\s*\{\s*([^,]+),/);
        if (entryMatch) {
            data.type = entryMatch[1].toLowerCase();
            data.key = entryMatch[2].trim();
        }

        // Extract fields
        const fieldRegex = /(\w+)\s*=\s*\{([^}]*)\}/g;
        let match;
        while ((match = fieldRegex.exec(bibtex)) !== null) {
            const key = match[1].toLowerCase();
            const value = match[2].trim();
            data[key] = value;
        }

        // Clean and format data
        return {
            title: data.title || 'Untitled',
            authors: this.formatAuthors(data.author || ''),
            venue: this.formatVenue(data),
            year: parseInt(data.year) || new Date().getFullYear(),
            doi: data.doi || '',
            url: data.url || '',
            abstract: data.abstract || '',
            keywords: data.keywords || '',
            type: data.type || 'article'
        };
    }

    /**
     * Format authors string
     * @param {string} authors - Raw authors string
     * @returns {string} Formatted authors
     */
    formatAuthors(authors) {
        return authors
            .split(' and ')
            .map(author => author.trim())
            .join(', ');
    }

    /**
     * Format venue information
     * @param {Object} data - Parsed BibTeX data
     * @returns {string} Formatted venue
     */
    formatVenue(data) {
        if (data.journal) {
            return data.journal + (data.volume ? ` ${data.volume}` : '') + 
                   (data.number ? `(${data.number})` : '') +
                   (data.pages ? `: ${data.pages}` : '') +
                   (data.year ? ` (${data.year})` : '');
        } else if (data.booktitle) {
            return data.booktitle + (data.year ? ` (${data.year})` : '');
        } else if (data.school) {
            return `${data.school}${data.year ? ` (${data.year})` : ''}`;
        }
        return 'Unknown Venue';
    }

    /**
     * Generate HTML for a single publication card
     * @param {Object} pub - Publication data
     * @returns {string} HTML string
     */
    generatePublicationCard(pub) {
        const imageSrc = pub.image || 'assets/file/images/pic01.jpg';
        const title = pub.title || 'Untitled';
        const authors = pub.authors || 'Unknown Authors';
        const venue = pub.venue || 'Unknown Venue';
        
        // Generate links with proper labels
        const links = [];
        if (pub.pdf) links.push(`<a href="${pub.pdf}" class="btn btn-outline-secondary" target="_blank">PDF</a>`);
        if (pub.doi) links.push(`<a href="${pub.doi}" class="btn btn-outline-secondary" target="_blank">DOI</a>`);
        if (pub.url) links.push(`<a href="${pub.url}" class="btn btn-outline-secondary" target="_blank">Link</a>`);
        if (pub.slides) links.push(`<a href="${pub.slides}" class="btn btn-outline-secondary" target="_blank">Slides</a>`);
        if (pub.poster) links.push(`<a href="${pub.poster}" class="btn btn-outline-secondary" target="_blank">Poster</a>`);
        if (pub.video) links.push(`<a href="${pub.video}" class="btn btn-outline-secondary" target="_blank">Video</a>`);
        if (pub.code) links.push(`<a href="${pub.code}" class="btn btn-outline-secondary" target="_blank">Code</a>`);

        // Generate award if exists
        const award = pub.award ? `<p class="publication-award"><strong>Award:</strong> ${pub.award}</p>` : '';
        
        // Generate abbreviation badge if exists
        const abbr = pub.abbr ? `<span class="publication-abbr">${pub.abbr}</span>` : '';
        
        // Add selected indicator if marked as selected
        const selectedClass = pub.selected ? ' publication-selected' : '';

        return `
            <div class="publication-card${selectedClass}">
                <div class="card-body">
                    <div class="row no-gutters">
                        <div class="col-md-3 image-col">
                            <div class="publication-media">
                                <img src="${imageSrc}" alt="Publication Image" class="publication-img" onerror="this.src='assets/file/images/pic01.jpg'">
                            </div>
                            <div class="publication-badges">
                                ${abbr}
                                ${award}
                            </div>
                        </div>
                        <div class="col-md-9">
                            <div class="card-content">
                                <div class="publication-main">
                                    <p class="publication-title">${title}</p>
                                    <p class="publication-authors">${authors}</p>
                                    <p class="publication-venue">${venue}</p>
                                </div>
                                <div class="publication-links">
                                    ${links.join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate HTML for a year group
     * @param {number} year - Year
     * @param {Array} publications - Publications for that year
     * @returns {string} HTML string
     */
    generateYearGroup(year, publications) {
        const pubCards = publications.map(pub => this.generatePublicationCard(pub)).join('');
        
        return `
            <div class="year-group">
                <h4 class="year-header">${year}</h4>
                <div class="publications-list">
                    ${pubCards}
                </div>
            </div>
        `;
    }

    /**
     * Generate HTML for a category
     * @param {string} categoryKey - Category key
     * @param {string} categoryTitle - Category display title
     * @param {Object} yearData - Year-organized publication data
     * @returns {string} HTML string
     */
    generateCategory(categoryKey, categoryTitle, yearData) {
        const years = Object.keys(yearData).sort((a, b) => b - a); // Sort descending
        const yearGroups = years.map(year => 
            this.generateYearGroup(year, yearData[year])
        ).join('');

        return `
            <div class="publication-category">
                <h3 class="category-title">${categoryTitle}</h3>
                ${yearGroups}
            </div>
        `;
    }

    /**
     * Render all publications to the page
     * @param {string} targetId - Target container ID
     */
    renderPublications(targetId = 'dynamic-publications') {
        const container = document.getElementById(targetId);
        if (!container) {
            console.error(`Container with ID '${targetId}' not found`);
            return;
        }

        let html = '';
        
        // Render research papers
        if (this.publications['research-papers'] && Object.keys(this.publications['research-papers']).length > 0) {
            html += this.generateCategory('research-papers', 'Research Papers', this.publications['research-papers']);
        }

        // Render patents
        if (this.publications['patents'] && Object.keys(this.publications['patents']).length > 0) {
            html += this.generateCategory('patents', 'Patents', this.publications['patents']);
        }

        container.innerHTML = html;
    }

    /**
     * Clear all publications
     */
    clear() {
        this.publications = {
            'research-papers': {},
            'patents': {}
        };
    }
}

// Initialize global publication manager
const pubManager = new PublicationManager();

// Auto-render when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // You can add your publications here
    // addPublicationExample();
    // addFromBibTeXExample();
    
    // Render publications
    pubManager.renderPublications();
});

// Export for global use
window.PublicationManager = PublicationManager;
window.pubManager = pubManager;
