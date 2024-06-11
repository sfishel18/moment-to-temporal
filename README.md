# Moment to Temporal

A code-mod to transform your Moment.js code into Temporal API code.

## About

The goal of this project is help development teams to modernize their code bases by replacing Moment.js code with [the upcoming Temporal API](https://tc39.es/proposal-temporal/docs/).

Replacing Moment.js with the Temporal API is a compelling idea for several reasons, primarily revolving around modernity, performance, and reliability. Moment.js, while historically popular and widely used, has several limitations that the Temporal API aims to address. One significant advantage of the Temporal API is its modern design, which incorporates years of feedback and lessons learned from using libraries like Moment.js. This results in a more intuitive, robust, and feature-rich API that aligns better with current JavaScript standards and practices. Performance is another crucial aspect where the Temporal API outshines Moment.js. Moment.js has been known to suffer from performance issues, especially in scenarios involving a large number of date manipulations or calculations. The Temporal API, designed with performance in mind, offers a more efficient handling of date and time operations. This efficiency not only speeds up the execution of applications but also reduces the amount of JavaScript that needs to be sent to the client, which is particularly beneficial for low-bandwidth or resource-constrained environments.

## CLI Usage

To apply the code-mod to your code base, simply run:

```
npx moment-to-temporal <path/to/source/>
```

This will run the transformation on all `.js`/`.jsx` and `.ts`/`.tsx` files in the specified directory.

Depending on which types of transformations are applied, you might need to add one or more new packages to your project, including:

- `@js-temporal/polyfill` - a polyfill for the Temporal API, which is needed until it is supported natively in all browsers
- `moment-to-temporal` itself - the package includes a small "runtime" of utility functions for common Temporal API operations

The command output will list the packages that need to be added.

## Caveats

These transformations are not guaranteed to produce code with exactly the same behavior. Please use them as a starting point and do your own verification that the transormed code is correct.