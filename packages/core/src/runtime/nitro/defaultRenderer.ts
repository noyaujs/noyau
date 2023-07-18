import { type RenderResponse } from "nitropack";
import { defineRenderHandler } from "#internal/nitro";

export default defineRenderHandler(
  async (event): Promise<Partial<RenderResponse>> => {
    const response: RenderResponse = {
      body: `<html>
        <head>
          <title>Noyau</title>
        </head>
          <body>
            <h1>Noyau</h1>
            <p>No renderer was set so here we are</p>
          </body>
        </html>`,
      statusCode: event.node.res.statusCode,
      statusMessage: event.node.res.statusMessage,
      headers: {
        "content-type": "text/html;charset=utf-8",
      },
    };

    return response;
  }
);
