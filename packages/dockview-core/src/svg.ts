const createSvgElementFromPath = (params: {
    height: string;
    width: string;
    viewbox: string;
    path: string;
}): SVGSVGElement => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttributeNS(null, 'height', params.height);
    svg.setAttributeNS(null, 'width', params.width);
    svg.setAttributeNS(null, 'viewBox', params.viewbox);
    svg.setAttributeNS(null, 'aria-hidden', 'false');
    svg.setAttributeNS(null, 'focusable', 'false');
    svg.classList.add('dv-svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttributeNS(null, 'd', params.path);
    svg.appendChild(path);
    return svg;
};

export const createCloseButton = (): SVGSVGElement =>
    createSvgElementFromPath({
        width: '11',
        height: '11',
        viewbox: '0 0 28 28',
        path: 'M2.1 27.3L0 25.2L11.55 13.65L0 2.1L2.1 0L13.65 11.55L25.2 0L27.3 2.1L15.75 13.65L27.3 25.2L25.2 27.3L13.65 15.75L2.1 27.3Z',
    });

export const createExpandMoreButton = (): SVGSVGElement =>
    createSvgElementFromPath({
        width: '11',
        height: '11',
        viewbox: '0 0 24 15',
        path: 'M12 14.15L0 2.15L2.15 0L12 9.9L21.85 0.0499992L24 2.2L12 14.15Z',
    });

export const createChevronRightButton = (): SVGSVGElement =>
    createSvgElementFromPath({
        width: '11',
        height: '11',
        viewbox: '0 0 15 25',
        path: 'M2.15 24.1L0 21.95L9.9 12.05L0 2.15L2.15 0L14.2 12.05L2.15 24.1Z',
    });
