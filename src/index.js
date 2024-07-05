import nunjucks from "nunjucks";
import parseCitations from "./parse-citations.js";

/**
 * Citation parsing patterns.
 * Note we do not yet support complex citation styles like [@smith{ii, A, D-Z}, with a suffix],
 * [@smith, {pp. iv, vi-xi, (xv)-(xvii)} with suffix here], or [@smith{}, 99 years later]
 */
let patterns = {};
patterns.citation = /([-~!]*?)@([^\s;,\]]+)/;
patterns.citations = new RegExp(`\\[\\s*(${patterns.citation.source})(\\s*[;,]\\s*(${patterns.citation.source}))*?\\s*\\]`, 'g');

// Eleventy deep clones plain objects, but we want an actual reference to this so we can modify it during templating.
class References {}
const references = new References();

export function processCitations (content, {
	key,
	render = c => `[${c.number}]`
}) {
	references[key] ??= [];
	let refs = references[key];

	content = content.replaceAll(patterns.citations, (match) => {
		let citations = match.slice(1, -1) // Drop brackets
							 .trim().split(";").map(cite => cite.trim()).filter(Boolean)
							 .map(citation => { // Parse citation
								let [, flags, locator] = citation.match(patterns.citation);
								let number = refs.indexOf(locator) + 1 || refs.push(locator);
								return {number, locator, flags};
							 });

		return render(citations);
	});

	// console.log(`Processed ${refs.length} citations for ${key}`);

	return content;
}

export default function (config, {
	citationTemplate = "_includes/_citations.njk"
} = {}) {
	function renderCitations (content) {
		references[this.page.outputPath] ??= [];
		let refs = references[this.page.outputPath];
		let all = parseCitations(content, refs);

		for (let i = all.length - 1; i >= 0; i--) {
			let info = all[i];
			let rendered = nunjucks.render(citationTemplate, info);
			// Replace with rendered citation in content
			content = content.slice(0, info.start) + rendered + content.slice(info.end);
		}

		return content;
	}

	config.addGlobalData("references", references);

	config.addFilter("citations", renderCitations);

	config.addPairedShortcode("citations", renderCitations);

	// config.addTransform("citations", async function (content) {
	// 	// TODO provide a way to filter out certain files
	// 	let {inputPath, outputPath} = this.page;
	// 	console.log(inputPath, "→", outputPath);
	// 	return processCitations(content, outputPath);
	// });
}