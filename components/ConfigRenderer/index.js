//@ flow

//react and styled-components
import React, { type ComponentType } from "react";
import styled from "styled-components";

type ConfigItemType = {
  getJSX: function,
  layout: string
};
const makeConfigItem = (
  type: string,
  getJSX: function,
  layout: string = "list"
) => {
  const configItem: ConfigItemType = {
    getJSX,
    layout
  };
  return [type, configItem];
};
const typeToConfigItemMap: any = new Map([
  makeConfigItem(
    "button",
    button => {
      if (!button) return null;
      const { onClick, children } = button;
      return <button onClick={onClick}>{children}</button>;
    },
    "list"
  ),
  makeConfigItem(
    "coords",
    data => {
      if (!data) return null;
      let { coords, delimiter = ", ", brackets = "" } = data;
      //if neither a string nor an array but truthy, default to ()
      if (typeof brackets != "string" && !Array.isArray(brackets)) {
        brackets = "()";
      }
      const [leftBracket = "", rightBracket = ""] = brackets;
      return (
        <pre>{`${leftBracket}${coords.join(delimiter)}${rightBracket}`}</pre>
      );
    },
    "inline"
  )
]);
type ConfigRendererProps = {
  className: string,
  config: Array
};
// This is a very generic renderer, taking config and outputting jsx.
const ConfigRenderer = (styled(({ className = "", config = [] }) => {
  className += " ConfigRenderer";
  return (
    <div className={className}>
      {config.map(({ label, type, data }, index) => {
        const { getJSX, layout }: ConfigItemType = typeToConfigItemMap.get(
          type
        );
        return (
          <div
            key={index + className}
            className={`flexible-container contains-${layout}-items`}
          >
            {label && <label>{label}</label>}
            {getJSX(data)}
          </div>
        );
      })}
    </div>
  );
})`
  .flexible-container {
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;

    &.contains-list-items {
      flex-direction: column;
    }
    &.contains-inline-items {
      flex-direction: row;
      > * {
        margin-right: 4px;
        :first-child {
          margin-left: 0;
        }
      }
    }
    > * {
      display: inline-block;
    }
  }
  label,
  button,
  p,
  pre {
    font-size: 14px;
    margin: 0;
  }
`: ComponentType<ConfigRendererProps>);
export default ConfigRenderer;
