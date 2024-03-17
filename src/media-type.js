/*!
 *  Copyright (c) 2024, Rahul Gupta
 *
 *  This Source Code Form is subject to the terms of the Mozilla Public
 *  License, v. 2.0. If a copy of the MPL was not distributed with this
 *  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 *  SPDX-License-Identifier: MPL-2.0
 */

const TOKEN = "[-a-zA-Z0-9!#$%^&*_+{}\\|'.`~]+"
const MEDIA_TYPE = new RegExp(`^(${TOKEN})/(${TOKEN})$`);

/**
 * @typedef {import('structured-headers').Item} Item
 * @typedef {import('structured-headers').BareItem} BareItem
 * @typedef {import('structured-headers').Parameters} Parameters
 */

/**
 * Splits a media type string/token into its type and subtype components.
 *
 * @param {string} mediaType
 * @returns {string[]}
 */
function split(mediaType) {
  const match = MEDIA_TYPE.exec(mediaType);
  if (!match) {
    return [];
  }
  match.shift();
  return match.map(t => t.toLowerCase())
}

/**
 * Sorts an array of media-types (in the structured fields format)
 * based on HTTP rules specified in [RFC9110].
 *
 * @example
 * import { parseList } from "structured-headers";
 * import { mediaType } from "sf-utils";
 * const parsedAccept = parseList("text/html;level=3;q=0.7, text/html;q=0.7, text/plain;q=0.5, text/*;q=0.1");
 * const sortedAccept = mediaType.sort(parsedAccept);
 *
 * @param {Item[]} types
 * @returns {Item[]}
 */
function sort(types) {
  return types.slice().sort(comparator);
}

/**
 * Compares the priority of two media types based on their quality values,
 * type/subtype specificity, and parameters.
 *
 * @param {Item} a
 * @param {Item} b
 * @returns {number}
 */
function comparator(a, b) {
  return sortByQuality(a[1].get("q"), b[1].get("q")) || sortByType(a[0], b[0]) || sortByParameters(a[1], b[1]);
}

/**
 * Compares the quality values of two media types.
 *
 * @param {BareItem|undefined} a
 * @param {BareItem|undefined} b
 * @returns {number}
 */
function sortByQuality(a, b) {
  return extractQuality(b) - extractQuality(a);
}

/**
 * Extracts the quality value x1000 from a given input.
 *
 * @param {BareItem|undefined} q
 * @returns {number}
 */
function extractQuality(q) {
  if (q === undefined) return 1000;
  const qNum = (typeof q === 'number') ?
    q : Number(q.toString());
  if (qNum === 1) return 1000;
  if (qNum > 0 && qNum < 1) {
    return Math.floor(qNum * 1000);
  }
  return 0;
}

/**
 * Compares the priority of two media types by specificity.
 *
 * @param {BareItem} a
 * @param {BareItem} b
 * @returns {number}
 */
function sortByType(a, b) {
  const [aType, aSubtype] = split(a.toString());
  const [bType, bSubtype] = split(b.toString());
  // RFC 9110 does not speak of suffix ordering. We ignore that for now.
  if (aType == bType && aSubtype == bSubtype) return 0;
  if (aType == "*" && aSubtype == "*") return 1;
  if (bType == "*" && bSubtype == "*") return -1;
  if (aSubtype == "*" && bSubtype == "*") return 0;
  if (aSubtype == "*") return 1;
  if (bSubtype == "*") return -1;
  return 0
}

/**
 * Compares the priority of two media types by parameter count.
 *
 * @param {Parameters} a
 * @param {Parameters} b
 * @returns {number}
 */
function sortByParameters(a, b) {
  return b.size - countQ(b.has("q")) - a.size + countQ(a.has("q"));
}

/**
 * Returns count of `q` parameter.
 *
 * @param {boolean} a
 * @returns {number}
 */
function countQ(a) {
  return a ? 1 : 0;
}

/**
 * Compares requested media type with an allowed media type to determine if
 * they match based on type, subtype, and parameters.
 * If there are any parameter mismatches, it returns a Map containing the
 * mismatched parameters. Otherwise it returns a boolean.
 *
 * @example
 * import { parseList } from "structured-headers";
 * import { mediaType } from "sf-utils";
 * const parsedAccept = parseList("text/html;level=3;q=0.7, text/html;q=0.7, text/plain;q=0.5, text/*;q=0.1");
 * const mediaType.match = contains(parsedAccept, [["text/plain"], ["text/html", new Map([['level', 2]])]]);
 *
 * @param {any} req
 * @param {any} allowed
 * @returns {boolean | Map<any, any>}
 */
function match(req, allowed) {
  const [allowedType, allowedSubtype] = split(allowed[0]);
  const [reqType, reqSubtype] = split(req[0]);

  return (reqType == "*" || allowedType == reqType) &&
    (reqSubtype == "*" || allowedSubtype == reqSubtype) &&
    contains(req[1], allowed[1])
  ;
}

/**
 * Check if the parameters with the requested media-type exist on and are same
 * as the matched allowed media-type. If they both have the same parameters and
 * there is only mismatch of parameter values, the mismatched parameters are
 * returned. Parameter `q` is ignored.
 *
 * @param {any} req
 * @param {any} allowed
 * @returns {boolean|Parameters}
 */
function contains(req, allowed) {
  const misMatched = new Map();
  for (const key of req.keys()) {
    if (key === "q" || allowed.has(key)) {
      if (req.get(key) === allowed.get(key) || req.get(key).toString() === allowed.get(key).toString()) {
        continue;
      }
      else {
        misMatched.set(key, req.get(key));
        continue;
      }
    }
    return false;
  }
  return misMatched.size ? misMatched : true;
}

export {
  match,
  sort,
}
