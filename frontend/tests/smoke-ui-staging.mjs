#!/usr/bin/env node
/**
 * Smoke UI đọc-only bằng Chrome thật cho một ĐVSD và một PĐD trên staging.
 *
 * Script tự tạo hai tài khoản tạm, đăng nhập bằng JWT thật, mở các màn hình
 * chính, bắt lỗi JavaScript và luôn xóa tài khoản/profile sau khi chạy.
 */
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const STAGING_REF = "ihgfafubwyxnbubmppbj";
const APP_PORT = Number(process.env.SMOKE_PORT || 4175);
const APP_URL = `http://127.0.0.1:${APP_PORT}`;
const CDP_URL = "http://127.0.0.1:9239";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FRONTEND = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

const stagingUrl = (process.env.SUPABASE_STAGING_URL || "").replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_STAGING_SERVICE_ROLE_KEY || "";
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

if (!stagingUrl.includes(STAGING_REF) || !serviceKey || !anonKey) {
  throw new Error("Thiếu key hoặc URL không phải Supabase staging đã định danh.");
}

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${response.status} ${data?.message || data?.msg || text}`);
  }
  return data;
}

const adminHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

async function createAccount({ email, password, role, khoa, hoTen }) {
  const auth = await jsonRequest(`${stagingUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  try {
    await jsonRequest(`${stagingUrl}/rest/v1/users`, {
      method: "POST",
      headers: { ...adminHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({ email, role, khoa, ho_ten: hoTen }),
    });
  } catch (error) {
    await fetch(`${stagingUrl}/auth/v1/admin/users/${auth.id}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    throw error;
  }
  const session = await jsonRequest(`${stagingUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  return { id: auth.id, email, session };
}

async function deleteAccount(account) {
  if (!account) return;
  await fetch(`${stagingUrl}/rest/v1/users?email=eq.${encodeURIComponent(account.email)}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
  await fetch(`${stagingUrl}/auth/v1/admin/users/${account.id}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
}

async function waitFor(url, label, attempts = 80) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Tiến trình đang khởi động.
    }
    await sleep(250);
  }
  throw new Error(`Quá thời gian chờ ${label}.`);
}

class Cdp {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.errors = [];
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve: done, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else done(message.result);
      }
      if (message.method === "Runtime.exceptionThrown") {
        this.errors.push(message.params?.exceptionDetails?.text || "JavaScript exception");
      }
      if (
        message.method === "Log.entryAdded"
        && message.params?.entry?.level === "error"
      ) {
        this.errors.push(message.params.entry.text);
      }
    });
  }

  call(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((done, reject) => {
      this.pending.set(id, { resolve: done, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
}

async function newPage() {
  const target = await jsonRequest(
    `${CDP_URL}/json/new?${encodeURIComponent(APP_URL)}`,
    { method: "PUT" },
  );
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done, reject) => {
    socket.addEventListener("open", done, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  const cdp = new Cdp(socket);
  await cdp.call("Runtime.enable");
  await cdp.call("Log.enable");
  await cdp.call("Page.enable");
  await cdp.call("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sleep(800);
  return cdp;
}

async function evaluate(cdp, expression) {
  const result = await cdp.call("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Runtime.evaluate thất bại");
  }
  return result.result?.value;
}

async function bodyText(cdp) {
  return evaluate(cdp, "document.body?.innerText || ''");
}

async function clickText(cdp, label, startsWith = false) {
  const clicked = await evaluate(
    cdp,
    `(() => {
      const label = ${JSON.stringify(label)};
      const button = [...document.querySelectorAll("button")].find((node) => {
        const text = (node.innerText || "").trim();
        return ${startsWith ? "text.startsWith(label)" : "text === label"};
      });
      if (!button) return false;
      button.click();
      return true;
    })()`,
  );
  if (!clicked) throw new Error(`Không tìm thấy nút "${label}".`);
  await sleep(1100);
  const text = await bodyText(cdp);
  if (text.includes("Không đọc được trạng thái")) {
    throw new Error(`Màn "${label}" báo Không đọc được trạng thái.`);
  }
}

function expectText(text, expected, role) {
  if (!text.includes(expected)) {
    throw new Error(
      `${role}: thiếu nội dung "${expected}". Nội dung hiện tại: `
      + text.replace(/\s+/g, " ").slice(0, 500),
    );
  }
}

async function testRole(account, role) {
  const cdp = await newPage();
  const storageKey = `sb-${STAGING_REF}-auth-token`;
  await evaluate(
    cdp,
    `localStorage.setItem(
      ${JSON.stringify(storageKey)},
      ${JSON.stringify(JSON.stringify(account.session))}
    )`,
  );
  await cdp.call("Page.reload", { ignoreCache: true });
  await sleep(2800);

  let text = await bodyText(cdp);
  expectText(text, "Dự trù & đấu thầu VTYT", role);
  expectText(text, role === "PĐD" ? "Phòng Điều dưỡng" : "KHOA UI SMOKE", role);
  if (text.includes("Không đọc được trạng thái")) {
    throw new Error(`${role}: menu gói thầu không đọc được trạng thái.`);
  }

  for (const goi of ["Gói 18 tháng", "Gói bổ sung", "Gói chỉ định thầu"]) {
    await clickText(cdp, goi, true);
    text = await bodyText(cdp);
    expectText(text, "Đề xuất số lượng", role);
    expectText(text, role === "PĐD" ? "Đề xuất các khoa" : "Đề xuất của tôi", role);
    await clickText(cdp, "Đề xuất số lượng");
    await clickText(cdp, role === "PĐD" ? "Đề xuất các khoa" : "Đề xuất của tôi");
    if (goi !== "Gói chỉ định thầu" && role === "PĐD") {
      await clickText(cdp, "Tổng hợp & xuất hồ sơ");
    }
    await clickText(
      cdp,
      goi === "Gói chỉ định thầu" ? "Hồ sơ chỉ định thầu" : "Hồ sơ của khoa",
    );
  }

  for (const common of [
    "Gói tùy chọn mua thêm",
    "Điều chỉnh tiêu chí kỹ thuật",
    "Tiến độ sử dụng",
    "Lịch sử hồ sơ đề xuất",
    "Tiến độ gói thầu",
  ]) {
    await clickText(cdp, common, common === "Gói tùy chọn mua thêm");
  }
  if (role === "PĐD") {
    await clickText(cdp, "Tổng hợp kết quả thầu");
    await clickText(cdp, "Chờ duyệt");
  }

  if (cdp.errors.length) {
    throw new Error(`${role}: lỗi JavaScript: ${cdp.errors.join(" | ")}`);
  }
  cdp.socket.close();
  console.log(`PASS UI ${role}: đăng nhập thật và mở toàn bộ màn hình chính`);
}

let vite;
let chrome;
let profileDir;
let dvsd;
let pdd;

try {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const password = `Codex-Ui-${crypto.randomUUID()}!`;
  dvsd = await createAccount({
    email: `codex-ui-dvsd-${suffix}@umc.edu.vn`,
    password,
    role: "dvsd",
    khoa: `KHOA UI SMOKE ${suffix}`,
    hoTen: "Codex UI ĐVSD",
  });
  pdd = await createAccount({
    email: `codex-ui-pdd-${suffix}@umc.edu.vn`,
    password,
    role: "dieu_duong",
    khoa: "Phòng Điều dưỡng",
    hoTen: "Codex UI PĐD",
  });

  vite = spawn(
    "npm",
    ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(APP_PORT), "--strictPort"],
    { cwd: FRONTEND, env: process.env, stdio: "ignore" },
  );
  await waitFor(APP_URL, "Vite");

  profileDir = await mkdtemp(`${tmpdir()}/vtyt-ui-smoke-`);
  chrome = spawn(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--remote-allow-origins=*",
      "--remote-debugging-port=9239",
      `--user-data-dir=${profileDir}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  await waitFor(`${CDP_URL}/json/version`, "Chrome CDP");

  await testRole(dvsd, "ĐVSD");
  await testRole(pdd, "PĐD");
  console.log("PASS UI: không còn trạng thái gói thầu không đọc được");
} finally {
  if (chrome) chrome.kill("SIGTERM");
  if (vite) vite.kill("SIGTERM");
  await deleteAccount(dvsd);
  await deleteAccount(pdd);
  if (profileDir) await rm(profileDir, { recursive: true, force: true });
}
