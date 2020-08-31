import * as React from "react";
import { Api, IPanelProps } from "splitview";

export const Editor = (props: IPanelProps & { layoutApi: Api }) => {
  const [tabHeight, setTabHeight] = React.useState<number>(0);

  React.useEffect(() => {
    if (props.layoutApi) {
      setTabHeight(props.layoutApi.getTabHeight());
    }
  }, [props.layoutApi]);

  const onTabHeightChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (!Number.isNaN(value)) {
      setTabHeight(value);
    }
  };

  const onClick = () => {
    props.layoutApi.setTabHeight(tabHeight);
  };

  return (
    <div style={{ height: "100%", backgroundColor: "white", color: "black" }}>
      <label>
        Tab height
        <input onChange={onTabHeightChange} value={tabHeight} type="number" />
        <button onClick={onClick}>Apply</button>
      </label>
    </div>
  );
};
