export async function dynamicImport(modulePath: string) {
  return new Function("modulePath", "return import(modulePath);")(modulePath);
}
