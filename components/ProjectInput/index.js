// @flow

import React, { type ComponentType, useState } from "react";
import styled from "styled-components";
type ProjectInputProps = {
  className?: string,
  onApplyChanges: function,
  onChange?: function,
  namespace: string
};
const ProjectInput = ({
  className = "",
  namespace = "",
  onChange,
  onApplyChanges
}) => {
  className += " ProjectInput";
  const [project, setProject] = useState({
    namespace
  });
  return (
    <div className={className}>
      <h3>Project data</h3>
      <span>
        <label htmlFor="project-namespace-input">Namespace ({namespace})</label>
      </span>
      <span>
        <input
          type="text"
          placeholder="Namespace"
          id="project-namespace-input"
          value={project.namespace}
          onChange={e => {
            const value = e.target.value;
            setProject(project => ({
              ...project,
              namespace: value
            }));
          }}
        />
      </span>
      <span>
        <button onClick={() => onApplyChanges(project)}>Apply changes</button>
      </span>
    </div>
  );
};

const ProjectInputStyled = (styled(ProjectInput)`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin-top: 16px;
  background-color: #eeeeee;
`: ComponentType<ProjectInputProps>);
export default ProjectInputStyled;
