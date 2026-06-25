// Experience Data Loader and Renderer
class ExperienceLoader {
    constructor() {
        this.experienceData = null;
        this.loadExperience();
    }

    async loadExperience() {
        const loadingElement = document.getElementById('experience-loading');
        const contentElement = document.getElementById('experience-content');

        console.log('ExperienceLoader: Starting to load experience data...');

        try {
            // Show loading indicator
            if (loadingElement) {
                loadingElement.style.display = 'block';
                loadingElement.innerHTML = '<p>Loading experience...</p>';
            }

            console.log('ExperienceLoader: Fetching assets/content/experience.md...');
            
            // Load from the markdown file
            const response = await fetch('assets/content/experience.md?v=' + new Date().getTime());
            if (!response.ok) {
                throw new Error(`Failed to load experience file: ${response.status} ${response.statusText}`);
            }

            const markdownContent = await response.text();
            console.log('ExperienceLoader: Successfully loaded experience file, content length:', markdownContent.length);
            console.log('ExperienceLoader: First 200 chars of content:', markdownContent.substring(0, 200));

            // Parse the YAML-like content
            this.experienceData = this.parseExperienceMarkdown(markdownContent);
            console.log('ExperienceLoader: Parsed experience data:', this.experienceData);

            // Render the experience
            this.renderExperience();

            // Hide loading indicator
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }

            console.log('ExperienceLoader: Successfully loaded and rendered experience');

        } catch (error) {
            console.error('ExperienceLoader: Error loading experience:', error);
            
            // Show error message
            if (loadingElement) {
                loadingElement.innerHTML = `
                    <p style="color: #cb181d;">
                        Error loading experience: ${error.message}<br>
                        Please check that the file 'assets/content/experience.md' exists and is accessible.
                    </p>
                `;
            }
        }
    }

    parseExperienceMarkdown(content) {
        const data = { education: [], work: [], awards: [], talks: [], teaching: [] };
        let currentSection = null;
        let currentItem = null;
        let inSummary = false;

        const lines = content.split('\n');

        const saveCurrentItem = () => {
            if (currentItem && currentSection && data[currentSection]) {
                data[currentSection].push(currentItem);
                console.log(`ExperienceLoader: Saved item to ${currentSection}:`, currentItem);
            }
        };

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue; // Skip empty lines

            // Check for top-level section headers
            const sectionMatch = line.match(/^(\w+):$/);
            if (sectionMatch && data.hasOwnProperty(sectionMatch[1])) {
                saveCurrentItem();
                currentSection = sectionMatch[1];
                currentItem = null;
                inSummary = false;
                console.log(`ExperienceLoader: Switched to section: ${currentSection}`);
                continue;
            }

            // Check for the start of a new list item
            if (line.startsWith('  - ')) {
                saveCurrentItem();
                currentItem = {};
                inSummary = false;

                // Handle properties on the same line as the list item marker
                const sameLinePropertyMatch = line.match(/-\s+([\w_]+):\s*(.*)/);
                if (sameLinePropertyMatch) {
                    const [, key, value] = sameLinePropertyMatch;
                    currentItem[key] = value.replace(/['"]/g, '').trim();
                    continue; // Move to the next line
                }
            }

            if (!currentItem) continue;

            const propertyMatch = line.match(/^\s\s\s\s([\w_]+):\s*(.*)/);
            if (propertyMatch) {
                inSummary = false; // A new property means we're out of the summary
                const [, key, value] = propertyMatch;
                if (value.trim() === '' && key === 'summary') {
                    currentItem.summary = [];
                    inSummary = true;
                } else if (value.trim() === '' && key === 'button') {
                    currentItem.button = {};
                } else {
                    // Handle button properties
                    if (currentItem.button && (key === 'text' || key === 'url')) {
                         currentItem.button[key] = value.replace(/['"]/g, '');
                    } else {
                        currentItem[key] = value.replace(/['"]/g, '');
                    }
                }
            } else if (inSummary && line.startsWith('      - ')) {
                // This is a summary list item
                currentItem.summary.push(line.substring(8).trim());
            }
        }

        saveCurrentItem(); // Save the very last item in the file

        console.log(`ExperienceLoader: Final parsed data`, data);
        return data;
    }

    formatDate(dateStr) {
        if (!dateStr || dateStr === '') return 'Present';
        
        const date = new Date(dateStr);
        const options = { year: 'numeric', month: 'long' };
        return date.toLocaleDateString('en-US', options);
    }

    formatDateRange(startDate, endDate) {
        const start = this.formatDate(startDate);
        const end = this.formatDate(endDate);
        return `${start} – ${end}`;
    }

    getSortDate(item) {
        const dateValue = item.date_start || item.date || '';
        const academicDate = String(dateValue).trim().match(/^(\d{4})\s+(Jan|Spring|Summer|Fall)$/i);

        if (academicDate) {
            const termMonths = {
                jan: 0,
                spring: 0,
                summer: 5,
                fall: 8
            };
            return new Date(Number(academicDate[1]), termMonths[academicDate[2].toLowerCase()], 1);
        }

        const parsedDate = new Date(dateValue);
        return Number.isNaN(parsedDate.getTime()) ? new Date(0) : parsedDate;
    }

    parseMarkdownLinks(text) {
        // Convert markdown links to HTML
        return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    }

    renderTimelineItem(item, type) {
        let title, organization, dateRange;

        if (type === 'education') {
            title = item.degree;
            organization = item.institution;
            dateRange = this.formatDateRange(item.date_start, item.date_end);
        } else if (type === 'work') {
            title = item.position;
            organization = item.company_name;
            dateRange = this.formatDateRange(item.date_start, item.date_end);
        } else if (type === 'awards') {
            title = item.title;
            organization = item.awarder;
            dateRange = this.formatDate(item.date);
        } else if (type === 'teaching') {
            title = item.activity;
            organization = item.role + ", " + item.location;
            dateRange = item.date;
        } else if (type === 'awards') {
            title = item.title;
            organization = item.awarder;
            dateRange = this.formatDate(item.date);
        } else {
            title = item.title || item.position;
            organization = item.company_name || item.institution;
            dateRange = this.formatDateRange(item.date_start, item.date_end);
        }

        const iconSvg = `<path d="M216 56H176V48a24 24 0 00-24-24H104A24 24 0 0080 48v8H40A16 16 0 0024 72V200a16 16 0 0016 16H216a16 16 0 0016-16V72A16 16 0 00216 56zM96 48a8 8 0 018-8h48a8 8 0 018 8v8H96zM216 72v41.61A184 184 0 01128 136a184.07 184.07 0 01-88-22.38V72zm0 128H40V131.64A200.19 200.19 0 00128 152a200.25 200.25 0 0088-20.37V200zM104 112a8 8 0 018-8h32a8 8 0 010 16H112a8 8 0 01-8-8z"></path>`;

        let summaryContent = '';
        if (Array.isArray(item.summary)) {
            const listItems = item.summary
                .map(line => `<li>${this.parseMarkdownLinks(line)}</li>`)
                .join('');
            summaryContent = `<ul>${listItems}</ul>`;
        } else if (item.summary) {
            summaryContent = `<p>${this.parseMarkdownLinks(item.summary)}</p>`;
        }

        return `
            <li class="mb-10 ms-6 experience-item">
                <span class="absolute flex items-center justify-center w-6 h-6 bg-primary-100 rounded-full -start-3 ring-8 ring-white dark:ring-gray-900 dark:bg-primary-900">
                    <svg fill="currentColor" viewBox="0 0 256 256" class="w-5 h-5 text-primary-800 dark:text-primary-300">${iconSvg}</svg>
                </span>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${this.parseMarkdownLinks(title)}</h3>
                <p class="text-sm font-normal text-gray-500 dark:text-gray-300">${organization}</p>
                <p class="text-sm font-normal text-gray-500 dark:text-gray-300">${dateRange}</p>
                <div class="mt-2 mb-4 text-base font-normal text-gray-500 dark:text-gray-300 prose max-w-none prose-slate dark:prose-invert">
                    ${summaryContent}
                </div>
                ${item.button && item.button.text && item.button.url ? `<a href="${item.button.url}" target="_blank" rel="noopener" class="button">${item.button.text}</a>` : ''}
            </li>`;
    }

    renderSection(title, items, type) {
    if (!items || items.length === 0) return '';

    console.log(`Rendering ${title} section with ${items.length} items`);
    
    const timelineItems = items
        .sort((a, b) => {
            const dateA = this.getSortDate(a);
            const dateB = this.getSortDate(b);
            return dateB - dateA;
        })
        .map(item => this.renderTimelineItem(item, type))
        .join('');

    return `
        <div class="mb-12">
            <h3 class="mb-8 text-2xl font-bold">${title}</h3>
            <ol class="relative w-full border-s border-gray-200 dark:border-gray-700">
                ${timelineItems}
            </ol>
        </div>`;
}

    renderExperience() {
        const container = document.getElementById('experience-content');
        if (!container) {
            console.error('Experience container not found');
            return;
        }

        // Add the experience timeline class
        container.className = 'experience-timeline';

        // Hide loading indicator
        const loading = document.getElementById('experience-loading');
        if (loading) loading.style.display = 'none';

        if (!this.experienceData) {
            console.error('No experience data available');
            this.renderError();
            return;
        }

        // Debug data structure
        console.log('Education items:', this.experienceData.education?.length || 0);
        console.log('Work items:', this.experienceData.work?.length || 0);
        console.log('Awards items:', this.experienceData.awards?.length || 0);
        console.log('Talks items:', this.experienceData.talks?.length || 0);
        console.log('Teaching items:', this.experienceData.teaching?.length || 0);

        // Render each section with proper styling
        const educationSection = this.renderSection('Education', this.experienceData.education, 'education');
        const workSection = this.renderSection('Work Experience', this.experienceData.work, 'work');
        const awardsSection = this.renderSection('Awards & Honors', this.experienceData.awards, 'awards');
        const teachingSection = this.renderSection('Teaching', this.experienceData.teaching, 'teaching');

        container.innerHTML = `
            <div class="experience-container">
                ${educationSection}
                ${workSection}
                ${awardsSection}
                ${teachingSection}
            </div>
        `;
    }

    renderError() {
        const container = document.getElementById('experience-content');
        if (!container) return;

        // Hide loading indicator
        const loading = document.getElementById('experience-loading');
        if (loading) loading.style.display = 'none';

        container.innerHTML = `
            <div class="text-center py-8">
                <p class="text-red-600">Error loading experience data. Please try again later.</p>
            </div>`;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new ExperienceLoader();
});
