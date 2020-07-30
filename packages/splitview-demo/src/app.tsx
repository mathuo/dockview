import * as React from "react";
import { LoadFromConfig } from "./loadFromConfig";
import { FromApi } from "./fromApi";
import { PaneDemo } from "./pane";

import { Grid } from "./grid";

const options = [
  { id: "config", component: LoadFromConfig },
  { id: "api", component: FromApi },
  { id: "pane", component: PaneDemo },
  { id: "grid", component: Grid },
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
    <div style={{ height: "100vh", width: "100vh" }}>
      <select onChange={onChange} value={value}>
        {options.map((option, i) => (
          <option key={i} value={option.id}>
            {option.id}{" "}
          </option>
        ))}
      </select>

      {Component && (
        <div>
          <Component />
        </div>
      )}
    </div>
  );
};
