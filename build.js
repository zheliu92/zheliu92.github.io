const fs = require('fs-extra');
const path = require('path');
const { JSDOM } = require('jsdom');
const bibtexParser = require('bibtex-parser-js');

// --- Start of Ported AboutLoader Logic ---
function parseAboutMarkdown(markdown) {
    const sections = {
        'About Me': '',
    };
    let currentSection = 'About Me';
    const lines = markdown.split('\n');

    for (const line of lines) {
        if (line.startsWith('## ')) {
            const sectionTitle = line.substring(3).trim();
            if (sections.hasOwnProperty(sectionTitle)) {
                currentSection = sectionTitle;
            }
        } else if (currentSection) {
            sections[currentSection] += line + '\n';
        }
    }

    for (const section in sections) {
        sections[section] = sections[section].trim();
    }

    return sections;
}

function generateAboutHtml(aboutData) {
    let aboutHtml = parseMarkdown(aboutData['About Me']);
    return `<div class="markdown-body">${aboutHtml}</div>`;
}

function parseMarkdown(text) {
    // Bold
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return text;
}
// --- End of Ported AboutLoader Logic ---

// --- Start of Ported News Logic ---

function convertMarkdownLinks(text) {
    // Convert markdown links [text](url) to HTML links
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:black"><u>$1</u></a>');
}

function parseNewsMarkdown(markdown) {
    const lines = markdown.split('\n').filter(line => line.trim() !== '');
    const newsItems = [];
    
    lines.forEach(line => {
        const match = line.match(/^(\d{4}-\d{2}-\d{2}):\s*(.+)$/);
        if (match) {
            const content = convertMarkdownLinks(match[2].trim());
            newsItems.push({
                date: match[1],
                content: content
            });
        }
    });
    
    return newsItems;
}

async function generateNewsHtml(assetsDir) {
    const newsFilePath = path.join(assetsDir, 'content', 'news.md');
    const markdownContent = await fs.readFile(newsFilePath, 'utf-8');
    const newsItems = parseNewsMarkdown(markdownContent);

    let newsHtml = '<div class="news-container">';
    newsItems.forEach(item => {
        newsHtml += `
            <div class="news-item">
                <span class="news-date">${item.date}</span>
                <span class="news-content">${item.content}</span>
            </div>
        `;
    });
    newsHtml += '</div>';
    
    return newsHtml;
}

// --- End of Ported News Logic ---

// --- Start of Ported Publications Logic ---

function parseBibFile(content) {
    // The bibtex-parser-js library expects a slightly different format, so we'll parse manually.
    const publications = [];
    const entries = content.split('@').slice(1);
    for (const entry of entries) {
        const pub = {};
        const lines = entry.split('\n');
        const typeMatch = lines[0].match(/(\w+)\s*\{\s*([^,]+),/);
        if (typeMatch) {
            pub.entryType = typeMatch[1].toLowerCase();
            pub.key = typeMatch[2].trim();
        }

        for (const line of lines.slice(1)) {
            const match = line.match(/\s*(\w+)\s*=\s*\{(.*)\},?/);
            if (match) {
                const key = match[1].toLowerCase().trim();
                let value = match[2].trim();
                // Remove trailing comma if it exists inside the braces
                if (value.endsWith(',')) {
                    value = value.slice(0, -1);
                }
                pub[key] = value;
            }
        }
        if(pub.key) {
            publications.push(pub);
        }
    }
    return publications;
}


function formatAuthors(authors) {
    if (!authors) return 'Unknown Authors';
    return authors.split(' and ').map(author => author.trim()).join(', ');
}

function formatVenue(pub) {
    if (pub.journal) {
        return pub.journal;
    }
    if (pub.booktitle) {
        return pub.booktitle;
    }
    if (pub.school) {
        return pub.school;
    }
    return 'Unknown Venue';
}

function generatePublicationCard(pub) {
    const imageSrc = pub.preview ? `assets/file/${pub.preview}` : 'assets/file/images/pic01.jpg';
    const title = pub.title || 'Untitled';
    const authors = formatAuthors(pub.author);
    const venue = formatVenue(pub);
    const year = pub.year || 'N/A';

    const links = [];
    if (pub.pdf) links.push(`<a href="${pub.pdf}" class="button small" target="_blank">PDF</a>`);
    if (pub.doi) links.push(`<a href="https://doi.org/${pub.doi}" class="button small" target="_blank">DOI</a>`);
    if (pub.url) links.push(`<a href="${pub.url}" class="button small" target="_blank">Link</a>`);
    if (pub.slides) links.push(`<a href="${pub.slides}" class="button small" target="_blank">Slides</a>`);
    if (pub.poster) links.push(`<a href="${pub.poster}" class="button small" target="_blank">Poster</a>`);
    if (pub.video) links.push(`<a href="${pub.video}" class="button small" target="_blank">Video</a>`);
    if (pub.code) links.push(`<a href="${pub.code}" class="button small" target="_blank">Code</a>`);

    const award = pub.award ? `<p class="publication-award"><i class="fa-solid fa-award"></i> ${pub.award}</p>` : '';
    const abbr = pub.abbr ? `<span class="publication-abbr">${pub.abbr}</span>` : '';
    const selectedClass = pub.selected === 'true' ? ' publication-selected' : '';

    return `
        <div class="publication-card${selectedClass}">
            <div class="card-body">
                <div class="row no-gutters">
                    <div class="col-md-3 image-col">
                        <img src="${imageSrc}" alt="Publication Image" class="publication-img" onerror="this.src='assets/file/images/pic01.jpg'">
                        ${abbr}
                    </div>
                    <div class="col-md-9">
                        <div class="card-content">
                            <p class="publication-title">${title}</p>
                            <p class="publication-authors">${authors}</p>
                            <p class="publication-venue"><em>${venue}, ${year}</em></p>
                            ${award}
                            <div class="publication-links">
                                ${links.join(' ')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}


function generatePublicationsHTML(publications) {
    const papers = publications.filter(p => p.type && p.type.toLowerCase() === 'paper');
    const patents = publications.filter(p => p.type && p.type.toLowerCase() === 'patent');

    const groupByCategoryAndYear = (pubs) => {
        return pubs.reduce((acc, pub) => {
            const year = pub.year || 'Misc';
            if (!acc[year]) {
                acc[year] = [];
            }
            acc[year].push(pub);
            return acc;
        }, {});
    };

    const renderCategory = (title, pubs) => {
        const groupedByYear = groupByCategoryAndYear(pubs);
        const sortedYears = Object.keys(groupedByYear).sort((a, b) => b - a);

        let categoryHtml = `<h2 class="major">${title}</h2>`;
        for (const year of sortedYears) {
            categoryHtml += `<h3 class="major">${year}</h3>`;
            const yearPubs = groupedByYear[year];
            categoryHtml += '<div class="publications-grid">';
            for (const pub of yearPubs) {
                categoryHtml += generatePublicationCard(pub);
            }
            categoryHtml += '</div>';
        }
        return categoryHtml;
    };

    let html = '';
    if (papers.length > 0) {
        html += renderCategory('Research Papers', papers);
    }
    if (patents.length > 0) {
        html += renderCategory('Patents', patents);
    }

    return html;
}

// --- End of Ported Publications Logic ---

// --- Start of Ported Projects Logic ---

async function parseProjectMarkdown(markdown) {
    const lines = markdown.split('\n');
    let title = '';
    let image = '';
    let description = '';

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('# ')) {
            title = trimmed.substring(2).trim();
        } else if (trimmed.startsWith('![') && trimmed.includes('](')) {
            const match = trimmed.match(/!\[.*?\]\((.*?)\)/);
            if (match) {
                image = match[1];
            }
        } else if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('![')) {
            if (description) description += ' ';
            description += trimmed;
        }
    }

    if (title) {
        return { title, image, description };
    }

    return null;
}

async function generateProjectsHTML(assetsDir) {
    const projectsMdPath = path.join(assetsDir, 'content', 'projects.md');
    const projectsMdContent = await fs.readFile(projectsMdPath, 'utf-8');

    const lines = projectsMdContent.split('\n');
    let sectionTitle = '';
    let description = '';
    const projectFiles = [];
    let inProjectsList = false;

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('# ')) {
            sectionTitle = trimmed.substring(2).trim();
        } else if (trimmed.startsWith('## Projects')) {
            inProjectsList = true;
        } else if (inProjectsList && trimmed.startsWith('- ')) {
            const projectFile = trimmed.substring(2).trim();
            if (projectFile.endsWith('.md')) {
                projectFiles.push(projectFile);
            }
        } else if (!inProjectsList && trimmed && !trimmed.startsWith('#')) {
            if (description) description += ' ';
            description += trimmed;
        }
    }

    const projectPromises = projectFiles.map(file => {
        const filePath = path.join(assetsDir, 'content', file);
        return fs.readFile(filePath, 'utf-8').then(parseProjectMarkdown);
    });

    const projects = (await Promise.all(projectPromises)).filter(p => p);

    const projectsHtml = projects.map(project => `
        <article>
            <a href="#" class="image"><img src="${project.image}" alt="" /></a>
            <div class="inner">
                <h4>${project.title}</h4>
                <p>${project.description}</p>
            </div>
        </article>
    `).join('');

    return `
        <div class="container">
            <header class="major">
                <h2>${sectionTitle}</h2>
            </header>
            <p>${description}</p>
            <div class="features">
                ${projectsHtml}
            </div>
        </div>
    `;
}

// --- End of Ported Projects Logic ---

// --- Start of Ported ExperienceLoader Logic ---
// Note: This logic is adapted from assets/js/experience.js to run in a Node.js environment.

function parseExperienceMarkdown(content) {
    const data = { education: [], work: [], awards: [], talks: [], teaching: [] };
    let currentSection = null;
    let currentItem = null;
    let inSummary = false;

    const lines = content.split('\n');

    const saveCurrentItem = () => {
        if (currentItem && currentSection && data[currentSection]) {
            data[currentSection].push(currentItem);
        }
    };

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        const sectionMatch = line.match(/^(\w+):$/);
        if (sectionMatch && data.hasOwnProperty(sectionMatch[1])) {
            saveCurrentItem();
            currentSection = sectionMatch[1];
            currentItem = null;
            inSummary = false;
            continue;
        }

        if (line.startsWith('  - ')) {
            saveCurrentItem();
            currentItem = {};
            inSummary = false;

            const sameLinePropertyMatch = line.match(/-\s+([\w_]+):\s*(.*)/);
            if (sameLinePropertyMatch) {
                const [, key, value] = sameLinePropertyMatch;
                currentItem[key] = value.replace(/['"]/g, '').trim();
                continue; 
            }
        }

        if (!currentItem) continue;

        const propertyMatch = line.match(/^\s\s\s\s([\w_]+):\s*(.*)/);
        if (propertyMatch) {
            inSummary = false;
            const [, key, value] = propertyMatch;
            if (value.trim() === '' && key === 'summary') {
                currentItem.summary = [];
                inSummary = true;
            } else if (value.trim() === '' && key === 'button') {
                currentItem.button = {};
            } else {
                if (currentItem.button && (key === 'text' || key === 'url')) {
                     currentItem.button[key] = value.replace(/['"]/g, '');
                } else {
                    currentItem[key] = value.replace(/['"]/g, '');
                }
            }
        } else if (inSummary && line.startsWith('      - ')) {
            currentItem.summary.push(line.substring(8).trim());
        }
    }
    saveCurrentItem();
    return data;
}

function formatDate(dateStr) {
    if (!dateStr || dateStr === '') return 'Present';
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'long' };
    return date.toLocaleDateString('en-US', options);
}

function formatDateRange(startDate, endDate) {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    return `${start} – ${end}`;
}

function parseMarkdownLinks(text) {
    if (!text) return '';
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

function renderTimelineItem(item, type) {
    let title, organization, dateRange;

    if (type === 'education') {
        title = item.degree;
        organization = item.institution;
        dateRange = formatDateRange(item.date_start, item.date_end);
    } else if (type === 'work') {
        title = item.position;
        organization = item.company_name;
        dateRange = formatDateRange(item.date_start, item.date_end);
    } else if (type === 'teaching') {
        title = item.activity;
        organization = item.role + ", " + item.location;
        dateRange = item.date;
    } else if (type === 'awards') {
        title = item.title;
        organization = item.awarder;
        dateRange = formatDate(item.date);
    } else {
        title = item.title || item.position;
        organization = item.company_name || item.institution;
        dateRange = formatDateRange(item.date_start, item.date_end);
    }

    const iconSvg = `<path d="M216 56H176V48a24 24 0 00-24-24H104A24 24 0 0080 48v8H40A16 16 0 0024 72V200a16 16 0 0016 16H216a16 16 0 0016-16V72A16 16 0 00216 56zM96 48a8 8 0 018-8h48a8 8 0 018 8v8H96zM216 72v41.61A184 184 0 01128 136a184.07 184.07 0 01-88-22.38V72zm0 128H40V131.64A200.19 200.19 0 00128 152a200.25 200.25 0 0088-20.37V200zM104 112a8 8 0 018-8h32a8 8 0 010 16H112a8 8 0 01-8-8z"></path>`;

    let summaryContent = '';
    if (Array.isArray(item.summary)) {
        summaryContent = `<ul>${item.summary.map(line => `<li>${parseMarkdownLinks(line)}</li>`).join('')}</ul>`;
    } else if (item.summary) {
        summaryContent = `<p>${parseMarkdownLinks(item.summary)}</p>`;
    }

    return `
        <li class="mb-10 ms-6 experience-item">
            <span class="absolute flex items-center justify-center w-6 h-6 bg-primary-100 rounded-full -start-3 ring-8 ring-white dark:ring-gray-900 dark:bg-primary-900">
                <svg fill="currentColor" viewBox="0 0 256 256" class="w-5 h-5 text-primary-800 dark:text-primary-300">${iconSvg}</svg>
            </span>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${parseMarkdownLinks(title)}</h3>
            <p class="text-sm font-normal text-gray-500 dark:text-gray-300">${organization}</p>
            <p class="text-sm font-normal text-gray-500 dark:text-gray-300">${dateRange}</p>
            <div class="mt-2 mb-4 text-base font-normal text-gray-500 dark:text-gray-300 prose max-w-none prose-slate dark:prose-invert">
                ${summaryContent}
            </div>
            ${item.button && item.button.text && item.button.url ? `<a href="${item.button.url}" target="_blank" rel="noopener" class="button">${item.button.text}</a>` : ''}
        </li>`;
}

function renderSection(title, items, type) {
    if (!items || items.length === 0) return '';
    const timelineItems = items
        .sort((a, b) => {
            const dateA = new Date(a.date_start || a.date);
            const dateB = new Date(b.date_start || b.date);
            return dateB - dateA;
        })
        .map(item => renderTimelineItem(item, type))
        .join('');
    return `
        <div class="mb-12">
            <h3 class="mb-8 text-2xl font-bold">${title}</h3>
            <ol class="relative w-full border-s border-gray-200 dark:border-gray-700">
                ${timelineItems}
            </ol>
        </div>`;
}

function generateExperienceHTML(experienceData) {
    const educationSection = renderSection('Education', experienceData.education, 'education');
    const workSection = renderSection('Work Experience', experienceData.work, 'work');
    const awardsSection = renderSection('Awards & Honors', experienceData.awards, 'awards');
    const teachingSection = renderSection('Teaching', experienceData.teaching, 'teaching');

    return `
        <div class="experience-container">
            ${educationSection}
            ${workSection}
            ${awardsSection}
            ${teachingSection}
        </div>
    `;
}

// --- End of Ported Logic ---


async function build() {
    try {
        console.log('Starting static site build...');

        const distDir = path.join(__dirname, 'dist');
        const assetsDir = path.join(__dirname, 'assets');
        const distAssetsDir = path.join(distDir, 'assets');

        // 1. Clean and create the dist directory
        await fs.emptyDir(distDir);
        console.log('Cleaned dist directory.');

        // 2. Copy static assets and images
        await fs.copy(assetsDir, distAssetsDir);
        const imagesSourceDir = path.join(__dirname, 'images');
        if (await fs.pathExists(imagesSourceDir)) {
            await fs.copy(imagesSourceDir, path.join(distDir, 'images'));
        }
        await fs.copy(path.join(__dirname, 'LICENSE.txt'), path.join(distDir, 'LICENSE.txt'));
        await fs.copy(path.join(__dirname, 'README.txt'), path.join(distDir, 'README.txt'));
        console.log('Copied static assets.');

        // 3. Read the main HTML template
        const htmlTemplate = await fs.readFile(path.join(__dirname, 'index.html'), 'utf-8');
        const dom = new JSDOM(htmlTemplate);
        const { document } = dom.window;

        // 4. Process Experience Section
        const experienceContent = await fs.readFile(path.join(assetsDir, 'content', 'experience.md'), 'utf-8');
        const experienceData = parseExperienceMarkdown(experienceContent);
        const experienceHtml = generateExperienceHTML(experienceData);
        
        const experienceContainer = document.getElementById('experience-content');
        if (experienceContainer) {
            experienceContainer.className = 'experience-timeline'; // Add this line
            experienceContainer.innerHTML = experienceHtml;
            console.log('Successfully injected experience content.');
        } else {
            console.warn('Warning: #experience-content container not found in index.html.');
        }

        // 5. Process About and News sections
        const aboutContent = await fs.readFile(path.join(assetsDir, 'content', 'about.md'), 'utf-8');
        const aboutData = parseAboutMarkdown(aboutContent);
        const aboutHtml = generateAboutHtml(aboutData);
        const aboutContainer = document.getElementById('about-content');
        if (aboutContainer) {
            aboutContainer.innerHTML = aboutHtml;
            console.log('Successfully injected about content.');
        } else {
            console.warn('Warning: #about-content container not found in index.html.');
        }

        const newsContainer = document.getElementById('dynamic-news');
        if (newsContainer) {
            const newsHtml = await generateNewsHtml(assetsDir);
            newsContainer.innerHTML = newsHtml;
            console.log('Successfully injected news content.');
        } else {
            console.warn('Warning: #dynamic-news container not found in index.html.');
        }

        // 6. Process Publications
        const publicationsContent = await fs.readFile(path.join(assetsDir, 'content', 'publication.bib'), 'utf-8');
        const publicationsData = parseBibFile(publicationsContent);
        const publicationsHtml = generatePublicationsHTML(publicationsData);
        const publicationsContainer = document.getElementById('dynamic-publications');
        if (publicationsContainer) {
            publicationsContainer.innerHTML = publicationsHtml;
            console.log('Successfully injected publications content.');
        } else {
            console.warn('Warning: #dynamic-publications container not found in index.html.');
        }

        // 7. Process Projects
        const projectsHtml = await generateProjectsHTML(assetsDir);
        const projectsContainer = document.getElementById('projects');
        if (projectsContainer) {
            projectsContainer.innerHTML = projectsHtml;
            console.log('Successfully injected projects content.');
        } else {
            console.warn('Warning: #projects container not found in index.html.');
        }


        // 8. Remove loading indicators
        const loadingIds = ['about-loading', 'news-loading', 'publications-loading', 'experience-loading'];
        loadingIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.remove();
                console.log(`Removed loading indicator: #${id}`);
            }
        });

        // 9. Remove all script tags that were used for dynamic loading
        const scriptTags = document.querySelectorAll('script');
        scriptTags.forEach(script => {
            if (script.src.includes('experience.js') || script.src.includes('about.js') || script.src.includes('projects.js') || script.src.includes('publications.js') || script.src.includes('news.js') || script.src.includes('publications-data.js')) {
                script.remove();
            }
        });
        console.log('Removed dynamic loading scripts.');


        // 10. Serialize the DOM back to HTML and save it
        const finalHtml = dom.serialize();
        await fs.writeFile(path.join(distDir, 'index.html'), finalHtml);
        console.log('Successfully created dist/index.html.');

        console.log('\n✅ Build complete! Your static site is ready in the "dist" folder.');

    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();
