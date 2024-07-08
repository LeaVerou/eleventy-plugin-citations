import fs from "fs";

export function toArray(value) {
	if (value === null || value === undefined) {
		return [];
	}
	else if (Array.isArray(value)) {
		return value;
	}
	else {
		return [value];
	}
}

export function readTextFile (path, {description = "file", mustNotBeEmpty} = {}) {
	let contents;

	try {
		contents = fs.readFileSync(path, "utf-8");
	}
	catch (e) {
		throw new Error(`Could not read ${description} ${path}. Error was: ${e.message}`, {cause: e});
	}

	if (mustNotBeEmpty && !contents) {
		let Description = description[0].toUpperCase() + description.slice(1);
		throw new Error(`${Description} ${path} cannot be empty.`);
	}

	return contents;
}

export function escapeRegExp (string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Split while preserving delimiters
 * @param {string} text
 * @param {string | RegExp} pattern
 * @returns
 */
export function splitLossless (text, pattern) {
	let patternArray;
	if (Array.isArray(pattern)) {
		// Array of strings
		patternArray = pattern;
		pattern = RegExp(pattern.map(escapeRegExp).join("|"), "g");

	}

	let parts = [];
	let offset = 0; // character offset
	let index = {item: 0, delimiter: 0};

	for (let match of text.matchAll(pattern)) {
		let matchText = match[0];
		let start = match.index;
		let end = start + matchText.length;

		if (start > offset) {
			// There has been text since the last iteration, so that’s an item/delimiter
			parts.push({
				start: offset,
				end: start,
				type: "item",
				typeIndex: index.item++,
				text: text.slice(offset, start),
			});
		}

		if (start !== end) {
			let info = {start, end, type: "delimiter", typeIndex: index.delimiter++, text: matchText};
			if (patternArray) {
				info.patternIndex = patternArray.indexOf(matchText);
			}

			parts.push(info);
		}

		offset = end;
	}

	if (offset < text.length) {
		parts.push({
			start: offset, end: text.length,
			type: "item", typeIndex: index.item++,
			text: text.slice(offset),
		});
	}

	return parts;
}