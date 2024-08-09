document.getElementById('scrapeButton').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        function: scrapeCode,
      },
      async (results) => {
        if (chrome.runtime.lastError || !results || !results[0].result) {
          console.error(chrome.runtime.lastError || "No results returned");
          return;
        }
        const code = results[0].result;
        console.log('Scraped Code:', code); // Log the scraped code
        displayCode(code);
        enableDownload(code);
        enableCopy(code);
      }
    );
  });
});

function scrapeCode() {
  const html = document.documentElement.outerHTML;
  const css = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules).map((rule) => rule.cssText).join('\n');
      } catch (e) {
        return '';
      }
    })
    .join('\n');
  const scripts = Array.from(document.scripts)
    .map((script) => script.src ? fetch(script.src).then((res) => res.text()) : Promise.resolve(script.innerText));
  return Promise.all(scripts).then((scriptsContent) => ({
    html: html,
    css: css,
    js: scriptsContent.join('\n')
  }));
}

function displayCode(code) {
  if (!code.html || !code.css || !code.js) {
    console.error("Incomplete code object:", code);
    return;
  }
  console.log('Code to be displayed:', code); // Log code to be displayed
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = `
    <h2>HTML</h2>
    <pre><code class="language-markup">${Prism.highlight(code.html, Prism.languages.markup, 'markup')}</code></pre>
    <button id="copyHtml">Copy HTML</button>
    <h2>CSS</h2>
    <pre><code class="language-css">${Prism.highlight(code.css, Prism.languages.css, 'css')}</code></pre>
    <button id="copyCss">Copy CSS</button>
    <h2>JavaScript</h2>
    <pre><code class="language-javascript">${Prism.highlight(code.js, Prism.languages.javascript, 'javascript')}</code></pre>
    <button id="copyJs">Copy JavaScript</button>
    <button id="downloadHtml">Download HTML</button>
    <button id="downloadCss">Download CSS</button>
    <button id="downloadJs">Download JS</button>
  `;
}

function enableDownload(code) {
  document.getElementById('downloadHtml').addEventListener('click', () => downloadFile('code.html', code.html));
  document.getElementById('downloadCss').addEventListener('click', () => downloadFile('code.css', code.css));
  document.getElementById('downloadJs').addEventListener('click', () => downloadFile('code.js', code.js));
}

function enableCopy(code) {
  document.getElementById('copyHtml').addEventListener('click', () => copyToClipboard(code.html));
  document.getElementById('copyCss').addEventListener('click', () => copyToClipboard(code.css));
  document.getElementById('copyJs').addEventListener('click', () => copyToClipboard(code.js));
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    console.log('Text copied to clipboard');
  }).catch((err) => {
    console.error('Failed to copy text: ', err);
  });
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
