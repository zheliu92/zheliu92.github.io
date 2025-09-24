class ProjectsLoader {
    constructor() {
        this.projectsContainer = null;
        this.contentPath = 'assets/content/';
    }

    async init() {
        console.log('ProjectsLoader: Initializing projects section...');
        this.projectsContainer = document.getElementById('projects');
        
        if (!this.projectsContainer) {
            console.error('ProjectsLoader: Projects container not found');
            return;
        }

        try {
            await this.loadProjects();
            console.log('ProjectsLoader: Projects loaded successfully');
        } catch (error) {
            console.error('ProjectsLoader: Error loading projects:', error);
            this.showError();
        }
    }

    async loadProjects() {
        console.log('ProjectsLoader: Loading projects.md...');
        
        try {
            const response = await fetch(`${this.contentPath}projects.md?v=3`);
            if (!response.ok) {
                throw new Error(`Failed to load projects.md: ${response.status}`);
            }
            
            const markdown = await response.text();
            console.log('ProjectsLoader: projects.md loaded, parsing content...');
            
            await this.parseAndRenderProjects(markdown);
        } catch (error) {
            console.error('ProjectsLoader: Error in loadProjects:', error);
            throw error;
        }
    }

    async parseAndRenderProjects(markdown) {
        const lines = markdown.split('\n');
        let sectionTitle = '';
        let description = '';
        let projectFiles = [];
        
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

        console.log('ProjectsLoader: Found', projectFiles.length, 'project files:', projectFiles);
        
        // Load individual project contents
        const projects = await this.loadIndividualProjects(projectFiles);
        
        // Render the projects section
        this.renderProjects(sectionTitle, description, projects);
    }

    async loadIndividualProjects(projectFiles) {
        const projects = [];
        
        for (const file of projectFiles) {
            try {
                console.log(`ProjectsLoader: Loading ${file}...`);
                const response = await fetch(`${this.contentPath}${file}?v=3`);
                if (!response.ok) {
                    console.warn(`ProjectsLoader: Failed to load ${file}: ${response.status}`);
                    continue;
                }
                
                const markdown = await response.text();
                const project = this.parseProjectMarkdown(markdown);
                if (project) {
                    projects.push(project);
                }
            } catch (error) {
                console.warn(`ProjectsLoader: Error loading ${file}:`, error);
            }
        }
        
        console.log('ProjectsLoader: Loaded', projects.length, 'projects successfully');
        return projects;
    }

    parseProjectMarkdown(markdown) {
        const lines = markdown.split('\n');
        let title = '';
        let image = '';
        let description = '';
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            if (trimmed.startsWith('# ')) {
                title = trimmed.substring(2).trim();
            } else if (trimmed.startsWith('![') && trimmed.includes('](')) {
                // Extract image path from markdown image syntax
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

    renderProjects(sectionTitle, description, projects) {
        console.log('ProjectsLoader: Rendering projects section...');
        
        const html = `
            <div class="container">
                <header class="major">
                    <h2>${sectionTitle}</h2>
                </header>
                <p>${description}</p>
                <div class="features">
                    ${projects.map(project => `
                        <article>
                            <a href="#" class="image"><img src="${project.image}" alt="" /></a>
                            <div class="inner">
                                <h4>${project.title}</h4>
                                <p>${project.description}</p>
                            </div>
                        </article>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.projectsContainer.innerHTML = html;
        console.log('ProjectsLoader: Projects section rendered successfully');
    }

    showError() {
        const errorHtml = `
            <div class="container">
                <header class="major">
                    <h2>Side Projects</h2>
                </header>
                <div class="error-message" style="text-align: center; padding: 2em; color: #888;">
                    <p><strong>Unable to load projects content.</strong></p>
                    <p>Please check that the projects files are available.</p>
                </div>
            </div>
        `;
        
        if (this.projectsContainer) {
            this.projectsContainer.innerHTML = errorHtml;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const projectsLoader = new ProjectsLoader();
    projectsLoader.init();
});