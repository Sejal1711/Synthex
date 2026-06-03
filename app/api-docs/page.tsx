"use client";

import { useEffect, useRef } from "react";

export default function ApiDocsPage() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const SwaggerUI = (await import("swagger-ui-react")).default;
      await import("swagger-ui-react/swagger-ui.css");

      const { createRoot } = await import("react-dom/client");
      if (ref.current) {
        const root = createRoot(ref.current);
        root.render(
          SwaggerUI({
            url: "/api/docs",
            docExpansion: "list",
            tryItOutEnabled: true,
          }) as React.ReactElement
        );
      }
    }
    init();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1a1a2e",
      }}
    >
      <div ref={ref} />
    </div>
  );
}
