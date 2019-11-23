import React from "react";
import { withTheme } from "styled-components";
const ExternalLink = withTheme(
  ({
    to,
    children,
    icon = false,
    theme: {
      icons: { externalLink }
    }
  }) => {
    return (
      <a href={to} rel="noreferrer noopener" target="_blank">
        {icon ? externalLink : null}
        {children || to}
      </a>
    );
  }
);
export default ExternalLink;
