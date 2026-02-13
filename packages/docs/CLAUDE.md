# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the documentation site in this repository.

## Documentation Structure

### Auto-Generated Content

- `static/templates` - This directory is auto-generated and should not be edited manually
- Templates contain examples for plain TypeScript plus the supported frameworks: React, Vue, and Angular

### Legacy Content

- `sandboxes` - Legacy directory that we would rather delete than update
- Always ask before making changes to sandbox content as deletion is preferred

### Framework Examples

Any page that includes examples should provide implementations for:
- Vanilla TypeScript
- React
- Vue  
- Angular

Use the React component `FrameworkSpecific` to organize and display framework-specific examples on documentation pages.

## Supported Frameworks

The project supports the following frameworks:
- React
- Vue
- Angular
- Vanilla TypeScript (framework-agnostic)