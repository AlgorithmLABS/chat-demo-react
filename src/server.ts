import "dotenv/config";
import express from "express";
import { Configuration, OpenAIApi } from "openai";
//@ts-ignore
import SSE from "sse";

const app = express();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const port = process.env.PORT || 4000;

app.get("/chat", async (req, res) => {
  try {
    res.writeHead(200, {
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    });
    res.flushHeaders();

    const completion = await openai.createCompletion(
      {
        model: "text-davinci-003",
        prompt: req.query.msg as string,
        max_tokens: 2048,
        stream: true,
      },
      { responseType: "stream" },
    );

    let id = 1;
    //@ts-ignore
    completion.data.on("data", (data: Buffer) => {
      // console.log(data.toString("utf-8"));
      res.write(`event: message\nid: ${id}\n${data.toString("utf-8")}`);
      id++;
    });

    res.on("close", () => {
      console.log("close");
      res.end();
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
});

app.listen(port, () => {
  console.log(`server is listening at localhost:${port}`);
});
