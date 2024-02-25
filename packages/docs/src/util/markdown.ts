function convertUrl(url: string) {
    return url;
}

export const convertMarkdown = (content) =>
    content
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(
            /\[([^\]]+)\]\(([^)]+)\)/g,
            (_, text, href) => `<a href="${convertUrl(href)}">${text}</a>`
        )
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
