export function renderErrorPage(error?: any): string {
  const isDev = process.env.NODE_ENV === "development";
  const errorMessage = error?.message || "Something went wrong on our end. You can try refreshing or head back home.";
  const errorStack = error?.stack || "";
  
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: ${isDev ? '48rem' : '28rem'}; width: 100%; text-align: center; padding: 2rem; background: #fff; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: ${isDev ? '#ef4444' : '#4b5563'}; margin: 0 0 ${isDev ? '0.5rem' : '1.5rem'}; font-family: ${isDev ? 'monospace' : 'inherit'}; }
      pre { text-align: left; background: #f3f4f6; padding: 1rem; border-radius: 0.375rem; overflow-x: auto; font-size: 0.875rem; color: #374151; margin-bottom: 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>An error occurred</h1>
      <p>${isDev ? errorMessage : 'Something went wrong on our end.'}</p>
      ${isDev && errorStack ? `<pre>${errorStack}</pre>` : ''}
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}

