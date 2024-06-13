declare module "*.md" {
  export const plainText: string;
}

declare module "*.png" {
  const source: string;
  export default source;
}
