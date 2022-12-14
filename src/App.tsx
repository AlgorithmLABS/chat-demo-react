import React, { useEffect, useRef, useState } from "react";
import "./App.css";

import { ReactComponent as Send } from "icons/send.svg";

type TMessageType = "ai" | "me";

interface IMessage {
  type: TMessageType;
  value: string;
}

interface IModel {
  created: number;
  id: string;
  object: string;
  owned_by: string;
  root: string;
}

function App() {
  const [loading, setLoading] = useState(false);
  const [sendMessage, setSendMessage] = useState("");
  const [answer, setAnswer] = useState<string>("");
  const [messageList, setMessageList] = useState<IMessage[]>([]);

  const [modelList, setModelList] = useState<IModel[]>();
  const [selectedModel, setSelectedModel] = useState<IModel>();

  const [openSelect, setOpenSelect] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrolltoBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "auto" });
    }
  };

  const setMessageListFn = (value: string, type: TMessageType) =>
    setMessageList((prev) => [...prev, { value, type }]);

  const onOpenSelectFn = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setOpenSelect(true);
  };

  const onChangeSendMessage = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    if (value.trim().length === 0) {
      setSendMessage("");
    } else {
      setSendMessage(value);
    }
  };

  const onKeyDownFn = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      onSend();
    }
  };

  const onSelectModel = (e: React.MouseEvent<HTMLLIElement>, model: IModel) => {
    e.stopPropagation();
    setSelectedModel(model);
    setOpenSelect(false);
  };

  const onSend = async () => {
    if (loading) return;
    if (!sendMessage) return;
    setLoading(true);
    setMessageListFn(sendMessage, "me");

    let eventUrl = `http://localhost:4000/chat?msg=${encodeURIComponent(
      sendMessage
    )}`;
    if (selectedModel) {
      eventUrl += `&model=${encodeURIComponent(selectedModel?.id)}`;
    }

    setSendMessage("");

    const source = new EventSource(eventUrl);

    source.onmessage = (event) => {
      const parseData = JSON.parse(event.data);
      if (parseData?.choices?.[0]) {
        const data = parseData.choices[0];
        setAnswer((prev) => prev + data?.text || "");
        scrolltoBottom();
        if (data.finish_reason) {
          source.close();
          setLoading(false);
        }
      }
    };
    source.onopen = (event) => {
      console.log(event);
    };
    source.onerror = (event) => {
      console.log(event);
    };
  };

  useEffect(() => {
    if (answer && !loading) {
      setMessageListFn(answer, "ai");
      setAnswer("");
    }
  }, [answer, loading]);

  useEffect(() => {
    fetch("http://localhost:4000/models").then((d) =>
      d.json().then(({ data }) => {
        setModelList(data);
        setSelectedModel(data[0]);
      })
    );
  }, []);

  return (
    <main>
      <header>
        <h1>Demo Chat</h1>
        <div className="custom-select" onClick={onOpenSelectFn}>
          <span>{selectedModel?.id}</span>
          {openSelect && (
            <ul className="option-box">
              {modelList?.map((model) => (
                <li
                  key={`model_${model.id}`}
                  onClick={(e) => onSelectModel(e, model)}
                >
                  {model.id}
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>
      <div className="scroll-box">
        <ul>
          {messageList.map(({ value, type }, i) => (
            <li key={`message_${i}`} className={type}>
              {value}
            </li>
          ))}
          {answer && <li className="ai">{answer}</li>}
          <div ref={scrollRef} />
        </ul>
      </div>

      <div className="input-box">
        <textarea
          value={sendMessage}
          onChange={onChangeSendMessage}
          onKeyDown={onKeyDownFn}
        />
        <button onClick={onSend} disabled={loading}>
          {loading ? (
            <div className="stage">
              <div className="dot-pulse"></div>
            </div>
          ) : (
            <Send />
          )}
        </button>
      </div>
    </main>
  );
}

export default App;
