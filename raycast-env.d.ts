/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Harvest API Key - Greenhouse Harvest API key with read access. */
  "harvestApiKey": string,
  /** Harvest Base URL - Optional override for the Harvest API base URL. */
  "harvestBaseUrl"?: string,
  /** Recruiting Base URL - Optional override for the Greenhouse Recruiting app base URL. */
  "recruitingBaseUrl": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `index` command */
  export type Index = ExtensionPreferences & {}
  /** Preferences accessible in the `refresh-cache` command */
  export type RefreshCache = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `index` command */
  export type Index = {}
  /** Arguments passed to the `refresh-cache` command */
  export type RefreshCache = {}
}

