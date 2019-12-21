// @flow

import React, { type ComponentType } from "react";
import styled from "styled-components";
type ProjectInputProps = {
  className?: string,
  onChange: function,
};
const ProjectInput = (({ className = '', onChange }) => {
  className += ' ProjectInput';
  return (
    <div className={className}>
      <label htmlFor="project-namespace-input">Namespace</label>
      <input type="text" placeholder="Namespace" id="project-namespace-input" onChange={onChange}/>
    </div>
  );
})

const ProjectInputStyled = (styled(ProjectInput)`

`: ComponentType<ProjectInputProps>);
export default ProjectInputStyled;
