import React from 'react';
import {processAdmonitionProps} from '@docusaurus/theme-common';
import AdmonitionTypes from '@theme/Admonition/Types';
function getAdmonitionTypeComponent(type) {
  const component = AdmonitionTypes[type];
  if (component) {
    return component;
  }
  console.warn(
    `No admonition component found for admonition type "${type}". Using Info as fallback.`,
  );
  return AdmonitionTypes.info;
}
export default function Admonition(unprocessedProps) {
  const props = processAdmonitionProps(unprocessedProps);
  const AdmonitionTypeComponent = getAdmonitionTypeComponent(props.type);
  return <AdmonitionTypeComponent {...props} />;
}
