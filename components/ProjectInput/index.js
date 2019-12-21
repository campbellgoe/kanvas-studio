// @flow

import React, { type ComponentType } from "react";
import styled from "styled-components";
type ProjectInputProps = {
  className?: string,
  value: string,
  onChange?: function,
  onKeyUp?: function,
};
const ProjectInput = (({ className = '', value = '', onChange, onKeyUp }) => {
  className += ' ProjectInput';
  return (
    <div className={className}>
      <label htmlFor="project-namespace-input">Namespace</label>
      <input type="text" placeholder="Namespace" id="project-namespace-input" value={value} onChange={onChange} onKeyUp={onKeyUp} />
    </div>
  );
})

const ProjectInputStyled = (styled(ProjectInput)`

`: ComponentType<ProjectInputProps>);
export default ProjectInputStyled;
