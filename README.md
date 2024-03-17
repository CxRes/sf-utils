# Structured Field Utilities

Utilities to work with structured fields parsed by the [Structured Headers](https://www.npmjs.com/package/structured-headers) library.

## Installation

```sh
npm|pnpm|yarn add structured-field-utils
```

## Usage

### Media Types

Setup for the following examples:

```js
import { parseList } from "structured-headers";
import { mediaType } from "sf-utils";
```

#### Sort

Sorts an array of media-types (in the structured fields format) based on HTTP rules specified in [RFC9110].

```js
const parsedAccept = parseList("text/html;level=3;q=0.7, text/html;q=0.7, text/plain;q=0.5, text/*;q=0.1");
const sortedAccept = mediaType.sort(parsedAccept);
```

#### Match

Compares requested media type with an allowed media type to determine if they match based on type, subtype, and parameters.

Return a `Boolean` unless any of the parameter values mismatch, in which case it returns a `Map` containing the mismatched parameters.

```js
const match = mediaType.match(sortedAccept, [["text/plain"], ["text/html", new Map([['level', 2]])]]);
```

## Copyright and License

Copyright © 2024, [Rahul Gupta](https://cxres.pages.dev/profile#i)

The source code in this repository is released under the [Mozilla Public License v2.0](./LICENSE).
