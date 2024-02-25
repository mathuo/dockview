import React from 'react';
import clsx from 'clsx';
import Translate from '@docusaurus/Translate';
import AdmonitionLayout from '@theme/Admonition/Layout';
import IconWarning from '@theme/Admonition/Icon/Warning';
const infimaClassName = 'alert alert--warning';
const defaultProps = {
  icon: <IconWarning />,
  title: (
    <Translate
      id="theme.admonition.caution"
      description="The default label used for the Caution admonition (:::caution)">
      caution
    </Translate>
  ),
};
// TODO remove before v4: Caution replaced by Warning
// see https://github.com/facebook/docusaurus/issues/7558
export default function AdmonitionTypeCaution(props) {
  return (
    <AdmonitionLayout
      {...defaultProps}
      {...props}
      className={clsx(infimaClassName, props.className)}>
      {props.children}
    </AdmonitionLayout>
  );
}
