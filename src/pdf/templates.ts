export interface PdfTemplate {
    name: string;
    description: string;
    file: string;
}

export const pdfTemplates: Record<string, PdfTemplate> = {
    default: {
        name: 'default',
        description: 'Apple-inspired clean design',
        file: 'default.html',
    },
    github: {
        name: 'github',
        description: 'GitHub-flavored markdown style',
        file: 'github.html',
    },
    magazine: {
        name: 'magazine',
        description: 'VOGUE/WIRED premium magazine style',
        file: 'magazine.html',
    },
};

export function getTemplate(name: string): PdfTemplate {
    const template = pdfTemplates[name];
    if (!template) {
        throw new Error(`Unknown PDF template: ${name}. Available: ${Object.keys(pdfTemplates).join(', ')}`);
    }
    return template;
}
