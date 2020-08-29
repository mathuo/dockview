import * as React from "react";
import { LoadFromConfig } from "./loadFromConfig";
import { FromApi } from "./fromApi";
import { PaneDemo } from "./pane";
import { TestGrid } from "./layout-grid/reactgrid";

const options = [
  { id: "config", component: LoadFromConfig },
  { id: "api", component: FromApi },
  { id: "pane", component: PaneDemo },
  { id: "grid", component: TestGrid },
];

export const App = () => {
  const [value, setValue] = React.useState<string>(options[3].id);

  const onChange = (event: React.ChangeEvent<HTMLSelectElement>) =>
    setValue(event.target.value);

  const Component = React.useMemo(
    () => options.find((o) => o.id === value)?.component,
    [value]
  );

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <div style={{ height: "20px" }}>
        <select onChange={onChange} value={value}>
          {options.map((option, i) => (
            <option key={i} value={option.id}>
              {option.id}{" "}
            </option>
          ))}
        </select>
      </div>

      {Component && (
        <div style={{ width: "100%" }}>
          <Component />
        </div>
      )}
    </div>
  );
};
