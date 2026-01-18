const DEFAULT_BASE_URL = "https://harvest.greenhouse.io/v1";

export class HarvestClient {
  constructor({ apiKey, baseUrl = DEFAULT_BASE_URL, onBehalfOf } = {}) {
    if (!apiKey) {
      throw new Error("GREENHOUSE_HARVEST_API_KEY is required");
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.onBehalfOf = onBehalfOf || null;
  }

  buildHeaders(extraHeaders = {}) {
    const token = Buffer.from(`${this.apiKey}:`).toString("base64");
    const headers = {
      Authorization: `Basic ${token}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    };
    if (this.onBehalfOf) {
      headers["On-Behalf-Of"] = String(this.onBehalfOf);
    }
    return headers;
  }

  buildUrl(path, params) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${normalizedPath}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) {
          continue;
        }
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  parseNextLink(linkHeader) {
    if (!linkHeader) {
      return null;
    }
    const segments = linkHeader.split(",");
    for (const segment of segments) {
      const [urlPart, relPart] = segment.split(";").map((value) => value.trim());
      if (relPart === 'rel="next"') {
        return urlPart.replace(/^</, "").replace(/>$/, "");
      }
    }
    return null;
  }

  async request({ method = "GET", path, params, body, headers } = {}) {
    if (!path) {
      throw new Error("path is required");
    }
    const url = this.buildUrl(path, params);
    const response = await fetch(url, {
      method,
      headers: this.buildHeaders(headers),
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const contentType = response.headers.get("content-type") || "";
    let data;
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error = new Error(`Harvest API ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return { data, response };
  }

  async listAll(path, params) {
    let url = this.buildUrl(path, params);
    const results = [];

    while (url) {
      const response = await fetch(url, {
        headers: this.buildHeaders(),
      });

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        const error = new Error(`Harvest API ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      if (Array.isArray(data)) {
        results.push(...data);
      } else {
        results.push(data);
      }

      url = this.parseNextLink(response.headers.get("Link"));
    }

    return results;
  }
}
