/**
 * News Content Loader
 * Loads news items from markdown file and formats them according to the specified style
 */

/**
 * Load and display news from embedded data or markdown file
 */
async function loadNews() {
    try {
        // Check if embedded news data is available (preferred method)
        if (typeof window.NEWS_DATA !== 'undefined') {
            renderNewsItems(window.NEWS_DATA);
            
            // Hide loading indicator
            const loadingElement = document.getElementById('news-loading');
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            
            console.log(`Loaded ${window.NEWS_DATA.length} news items from embedded data`);
            return;
        }
        
        // Fallback to loading from markdown file
        const response = await fetch('assets/content/news.md');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const markdownContent = await response.text();
        const newsItems = parseNewsMarkdown(markdownContent);
        renderNewsItems(newsItems);
        
        // Hide loading indicator
        const loadingElement = document.getElementById('news-loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        console.log(`Loaded ${newsItems.length} news items from markdown file`);
        
    } catch (error) {
        console.error('Error loading news:', error);
        
        // Hide loading indicator and show error
        const loadingElement = document.getElementById('news-loading');
        if (loadingElement) {
            loadingElement.innerHTML = '<p style="color: #cb181d;">Error loading news. Please check the console for details.</p>';
        }
        
        // Fallback to embedded news data if available
        loadFallbackNews();
    }
}

/**
 * Parse markdown content into news items
 * @param {string} markdown - Raw markdown content
 * @returns {Array} Array of news items
 */
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

/**
 * Convert markdown links to HTML links with consistent styling
 * @param {string} text - Text containing markdown links
 * @returns {string} Text with HTML links
 */
function convertMarkdownLinks(text) {
    // Convert markdown links [text](url) to HTML links
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:black"><u>$1</u></a>');
}

/**
 * Process content to add proper links and formatting
 * @param {string} content - Raw content string
 * @returns {string} Formatted HTML content
 */
function formatNewsContent(content) {
    // Add links for specific terms (you can customize this based on your content)
    let formatted = content;
    
    // Format links that should be added based on the sample format
    // These would need to be customized based on actual content in news.md
    formatted = formatted.replace(/corpus/g, '<a href="https://human-ai.notion.site/data-storytelling-dec-2024" target="_blank" style="color:black"><u>corpus</u></a>');
    formatted = formatted.replace(/human-AI collaboration framework/g, '<a href="https://doi.org/10.1145/3613904.3642726" target="_blank" style="color:black"><u>human-AI collaboration framework</u></a>');
    formatted = formatted.replace(/paper(?!\s*accepted)/g, '<a href="https://arxiv.org/abs/2503.02631" target="_blank" style="color:black"><u>paper</u></a>');
    formatted = formatted.replace(/Social Computing Group/g, '<a href="https://www.microsoft.com/en-us/research/group/social-computing-beijing/" target="_blank" style="color:black"><u>Social Computing Group</u></a>');
    formatted = formatted.replace(/here/g, '<a href="https://arxiv.org/pdf/2401.03038" target="_blank" style="color:black"><u>here</u></a>');
    
    return formatted;
}

/**
 * Render news items in the specified format
 * @param {Array} newsItems - Array of news items
 */
function renderNewsItems(newsItems) {
    const container = document.getElementById('news-content');
    if (!container) {
        console.error('News content container not found');
        return;
    }
    
    const newsItemsHTML = newsItems.map(item => {
        // If content is already formatted (from embedded data), use as-is
        // Otherwise, apply formatting (from markdown parsing)
        const content = item.content.includes('<a href') ? item.content : formatNewsContent(item.content);
        
        return `
            <div data-v-750433cc="" class="list-group-item" style="text-align: left; border: 0px; padding: 0.25vw 0px 0.25vw 0vw;">
                <strong data-v-750433cc="">${item.date}</strong>: 
                <span data-v-750433cc="">${content}</span>
            </div>
        `;
    }).join('');
    
    const html = `
        <div class="card-body" style="border: 0px; padding: 5px 5px 5px 5vw;">
            <div class="list-group">
                ${newsItemsHTML}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * Fallback function for embedded news data
 */
function loadFallbackNews() {
    console.log('Using fallback news data');
    
    // Embedded fallback news data
    const fallbackNews = [
        {
            date: '2025-03-05',
            content: 'We release an updated data storytelling tool corpus labeled by our human-AI collaboration framework, together with a \'sequel\' paper.'
        },
        {
            date: '2025-03-01',
            content: 'Happy to share that we have four full papers about human-AI collaboration in screenwriting, data storytelling, and data science accepted to CHI 2025!'
        },
        {
            date: '2024-08-30',
            content: 'I join Social Computing Group at Microsoft Research Asia as a researcher!'
        },
        {
            date: '2024-07-22',
            content: 'I have successfully defended my thesis: Bridging Data Analysis and Storytelling with Human-AI Collaborative Tools! Many thanks to my advisor, Prof. Huamin Qu, all committee members, my collaborators, and friends!'
        },
        {
            date: '2024-07-08',
            content: 'I receive HKUST RedBird Academic Excellence Award for the third time!'
        },
        {
            date: '2024-06-21',
            content: 'Our paper ♠ SPADE on automatic assesertion generation for LLMs is accepted at VLDB 2024! Check the pre-print here.'
        }
    ];
    
    renderNewsItems(fallbackNews);
    
    // Hide loading indicator
    const loadingElement = document.getElementById('news-loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// Load news when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure all scripts are loaded
    setTimeout(loadNews, 100);
});