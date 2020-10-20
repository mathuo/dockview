export interface PanelCollection<T extends object> {
    [name: string]: React.FunctionComponent<T>;
}
