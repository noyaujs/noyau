import { defineRenderHandler } from "#internal/nitro";
import { useNitroApp } from "#internal/nitro/app";
import { type EventHandler } from "h3";
import { type RenderResponse } from "nitropack";

export type HtmlContext = {
  htmlAttrs: string[];
  head: string[];
  bodyAttrs: string[];
  bodyPrepend: string[];
  body: string[];
  bodyAppend: string[];
};

export type RendererResponse = {
  htmlContext: Partial<HtmlContext>;
};

function normalizeChunks(chunks: (string | undefined)[] = []) {
  return chunks.filter(Boolean).map((i) => i!.trim());
}

const normalizeHtmlContext = (htmlContext: Partial<HtmlContext>) => {
  return {
    htmlAttrs: normalizeChunks(htmlContext.htmlAttrs),
    head: normalizeChunks(htmlContext.head),
    bodyAttrs: normalizeChunks(htmlContext.bodyAttrs),
    bodyPrepend: normalizeChunks(htmlContext.bodyPrepend),
    body: normalizeChunks(htmlContext.body),
    bodyAppend: normalizeChunks(htmlContext.bodyAppend),
  };
};
function joinTags(tags: string[]) {
  return tags.join("");
}

function joinAttrs(chunks: string[]) {
  return chunks.join(" ");
}

export const renderHTMLDocument = (html: HtmlContext) => {
  return `<!DOCTYPE html>
<html ${joinAttrs(html.htmlAttrs)}>
<head>${joinTags(html.head)}</head>
<body ${joinAttrs(html.bodyAttrs)}>${joinTags(html.bodyPrepend)}${joinTags(
    html.body
  )}${joinTags(html.bodyAppend)}</body>
</html>`;
};

export const defineNoyauRenderer = (
  handler: EventHandler<RendererResponse>
) => {
  return defineRenderHandler(async (event) => {
    const nitroApp = useNitroApp();

    const { htmlContext } = await handler(event);

    await nitroApp.hooks.callHook("render:html", htmlContext);

    return {
      body: renderHTMLDocument(normalizeHtmlContext(htmlContext)),
      statusCode: event.node.res.statusCode,
      statusMessage: event.node.res.statusMessage,
      headers: {
        "content-type": "text/html;charset=utf-8",
      },
    } satisfies RenderResponse;
  });
};
