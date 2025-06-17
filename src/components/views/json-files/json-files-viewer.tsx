''`tsx
import { useState } from 'react';
import { Tabs } from 'your-tabs-component-library';

const MyComponent = () => {
  const [tab, setTab] = useState<'raw' | 'tree' | 'diagram'>('raw');

  const handleTabChange = (value: string) => {
    if (value === 'raw' || value === 'tree' || value === 'diagram') setTab(value);
  };

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
      <Tabs.Tab value="raw">Raw</Tabs.Tab>
      <Tabs.Tab value="tree">Tree</Tabs.Tab>
      <Tabs.Tab value="diagram">Diagram</Tabs.Tab>
    </Tabs>
  );
};

export default MyComponent;
```;
