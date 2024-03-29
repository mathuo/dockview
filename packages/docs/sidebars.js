/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
    // By default, Docusaurus generates a sidebar from the docs folder structure
    tutorialSidebar: [
        {
            type: 'category',
            label: 'Overview',
            collapsible: false,
            collapsed: false,
            items: [{ type: 'autogenerated', dirName: 'overview' }],
        },
        {
            type: 'category',
            label: 'Core Features',
            collapsible: false,
            collapsed: false,
            className: 'sidebar-section-header',
            items: [{ type: 'autogenerated', dirName: 'core' }],
        },
        {
            type: 'category',
            label: 'Auxilliary Components',
            collapsible: false,
            collapsed: false,
            className: 'sidebar-section-header',
            items: [{ type: 'autogenerated', dirName: 'other' }],
        },
        {
            type: 'category',
            label: 'Advanced Features',
            collapsible: false,
            collapsed: false,
            className: 'sidebar-section-header',
            items: [{ type: 'autogenerated', dirName: 'advanced' }],
        },
    ],
    api: [
        {
            type: 'category',
            label: 'Dockview',
            collapsible: false,
            collapsed: false,
            items: [{ type: 'autogenerated', dirName: 'api/dockview' }],
        },
        {
            type: 'category',
            label: 'Gridview',
            collapsible: false,
            collapsed: false,
            items: [{ type: 'autogenerated', dirName: 'api/gridview' }],
        },
        {
            type: 'category',
            label: 'Splitview',
            collapsible: false,
            collapsed: false,
            items: [{ type: 'autogenerated', dirName: 'api/splitview' }],
        },
        {
            type: 'category',
            label: 'Paneview',
            collapsible: false,
            collapsed: false,
            items: [{ type: 'autogenerated', dirName: 'api/paneview' }],
        },
    ],

    // But you can create a sidebar manually
    /*
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Tutorial',
      items: ['hello'],
    },
  ],
   */
};

module.exports = sidebars;
