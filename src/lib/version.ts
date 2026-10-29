import packageJson from '../../package.json'

/**
 * 版本号唯一来源：package.json。避免 health / api / mcp 三处硬编码漂移。
 */
export const APP_VERSION: string = packageJson.version

export const APP_NAME: string = packageJson.name
