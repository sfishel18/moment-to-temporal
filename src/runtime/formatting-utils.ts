export const mapFormatString = (format: string): string =>
  format
    .split(/\[|\]/)
    .map((part, i) =>
      i % 2 === 1 ? part : part.replace(/D/g, "d").replace(/YY/g, "yy"),
    )
    .join("'");
