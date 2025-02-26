export const currentSupportedLanguages = (() => {
  const langsFiles = import.meta.glob("../../../../locales/app/*.json")

  const langs = [] as string[]
  for (const key in langsFiles) {
    langs.push(key.split("/").pop()?.replace(".json", "") as string)
  }
  return langs
})()

export const dayjsLocaleImportMap = {
  en: ["en", () => import("dayjs/locale/en")],
  zh_CN: ["zh-cn", () => import("dayjs/locale/zh-cn")],
}
