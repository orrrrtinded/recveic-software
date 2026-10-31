const { app, BrowserWindow, Menu } = require("electron");
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "renderer");
let server;

function firebaseInit(response) {
  const request = https.get("https://projetointegrador-4f2dd.web.app/__/firebase/init.js", remote => {
    response.writeHead(remote.statusCode || 500, { "Content-Type": "application/javascript; charset=utf-8" });
    remote.pipe(response);
  }).on("error", () => { response.writeHead(503); response.end("throw new Error('Sem conexao com o Firebase.');"); });
  request.setTimeout(10000, () => request.destroy());
}

function startServer() {
  return new Promise(resolve => {
    server = http.createServer((request, response) => {
      const requestUrl = new URL(request.url, "http://localhost");
      if (requestUrl.pathname === "/firebase-init.js") return firebaseInit(response);
      const relative = requestUrl.pathname === "/" ? "index.html" : requestUrl.pathname.slice(1);
      if (!["index.html", "app.js", "validation.js", "style.css", "refinement.css"].includes(relative)) { response.writeHead(404); response.end(); return; }
      const target = path.resolve(root, relative);
      if (!target.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
      fs.readFile(target, (error, data) => {
        if (error) { response.writeHead(404); response.end("Arquivo nao encontrado."); return; }
        const type = target.endsWith(".js") ? "application/javascript" : target.endsWith(".css") ? "text/css" : "text/html";
        response.writeHead(200, {
          "Content-Type": `${type}; charset=utf-8`,
          "Cache-Control": "no-store"
        });
        response.end(data);
      });
    }).listen(0, "localhost", () => resolve(server.address().port));
  });
}

function createWindow(port) {
  const window = new BrowserWindow({ width: 1420, height: 900, minWidth: 1020, minHeight: 680, title: "RecVec | Controle de usuários", autoHideMenuBar: true, backgroundColor: "#0e120e", webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    if (new URL(url).origin !== `http://localhost:${port}`) event.preventDefault();
  });
  window.loadURL(`http://localhost:${port}`);
}

app.whenReady().then(async () => { Menu.setApplicationMenu(null); createWindow(await startServer()); });
app.on("window-all-closed", () => { server?.close(); if (process.platform !== "darwin") app.quit(); });
