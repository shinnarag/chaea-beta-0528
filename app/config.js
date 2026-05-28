(function configureChaeA() {
  const defaultApiOrigin = "https://chaea-beta-260511.shinnarag.workers.dev";
  // 로컬에서 실행 중이면 API 오버라이드 없이 상대 경로 사용
  const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
  const config = window.ChaeAConfig || { apiOrigin: isLocal ? "" : defaultApiOrigin };
  if (!config.apiOrigin && !isLocal) config.apiOrigin = defaultApiOrigin;
  const apiOrigin = String(config.apiOrigin || "").replace(/\/$/, "");

  window.ChaeAConfig = { ...config, apiOrigin };

  if (!apiOrigin) return;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (resource, init) => {
    const url = typeof resource === "string" ? resource : resource?.url || "";
    if (url.startsWith("/api/")) {
      return nativeFetch(`${apiOrigin}${url}`, init);
    }
    return nativeFetch(resource, init);
  };
})();
