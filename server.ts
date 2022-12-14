import "dotenv/config";
import express from "express";
import cors from "cors";
import { Configuration, OpenAIApi } from "openai";

const app = express();

const port = process.env.PORT || 4000;

const whitelist = ["http://localhost:3002", "https://chatgpt.algorithmlabs.io"];

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.use(
  cors({
    origin: (requestOrigin: string | undefined, callback) => {
      if (requestOrigin && whitelist.indexOf(requestOrigin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.get("/models", async (_, res) => {
  try {
    const {
      data: { data: list },
    } = await openai.listModels({
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    });
    const data = list.sort((a, b) => b.created - a.created);
    res.status(200).json({ data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
});

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
        model: (req.query.model as string) || "text-davinci-003",
        prompt: req.query.msg as string,
        max_tokens: 2048,
        stream: true,
      },
      { responseType: "stream" }
    );

    let id = 1;
    //@ts-ignore
    completion.data.on("data", (data: Buffer) => {
      res.write(`event: message\nid: ${id}\n${data.toString("utf-8")}`);
      id++;
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
});

app.listen(port, () => {
  console.log(`server is listening`);
});
