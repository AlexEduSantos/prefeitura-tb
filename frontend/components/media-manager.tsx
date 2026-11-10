"use client";

import { useState } from "react";
import { MediaExplorer } from "./media-explorer";

export const FileExplorer = () => {
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  return (
    <main className="flex flex-col gap-4">
      <MediaExplorer
        selectedItems={selectedItems}
        onSelectionChange={setSelectedItems}
        multiple={true}
        gridClassName="grid sm:grid-cols-4 xl:grid-cols-6 grid-cols-2 gap-4"
        showSearch={true}
        containerClassName="flex flex-col gap-4"
        enableBulkDelete={true}
      />
    </main>
  );
};
