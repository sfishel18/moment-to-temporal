import { API, FileInfo, Options } from "jscodeshift";

export default function evalPrepTransform(
  file: FileInfo,
  { j }: API,
  options: Options,
) {
  const source = j(file.source);
  source.find(j.ImportDeclaration).forEach((path) => path.replace());
  return source.toSource(options["printOptions"]);
}
