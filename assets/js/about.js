class AboutLoader {
    constructor() {
        this.contentFile = 'assets/content/about.md';
        this.loadingElementId = 'about-loading';
        this.contentElementId = 'about-content';
    }

    async loadAboutContent() {
        const loadingElement = document.getElementById(this.loadingElementId);
        const contentElement = document.getElementById(this.contentElementId);

        if (!contentElement) {
            console.error('About content container not found');
            return;
        }

        try {
            // Show loading indicator
            if (loadingElement) {
                loadingElement.style.display = 'block';
            }

            const response = await fetch(this.contentFile);
            if (!response.ok) {
                throw new Error(`Failed to load about content: ${response.status}`);
            }

            const markdownContent = await response.text();
            const htmlContent = this.parseMarkdown(markdownContent);
            
            // Insert the content
            contentElement.innerHTML = htmlContent;

            // Hide loading indicator
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }

        } catch (error) {
            console.error('Error loading about content:', error);
            if (loadingElement) {
                loadingElement.innerHTML = '<p style="color: #ff6b6b;">Failed to load about content. Please try refreshing the page.</p>';
            }
        }
    }

    parseMarkdown(markdown) {
        let html = markdown;

        // Remove the main heading
        html = html.replace(/^#\s+.*$/m, '');

        // Process bold text: **text** -> <strong>text</strong>
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Process links: [text](url) -> <a href="url">text</a>
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        // Convert paragraphs (split by double newlines)
        const paragraphs = html.split('\n\n').filter(p => p.trim());
        html = paragraphs.map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`).join('');
        
        return html;
    }
}

// Initialize the About loader when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const aboutLoader = new AboutLoader();
    aboutLoader.loadAboutContent();
});