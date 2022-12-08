import React, { useState } from "react";
import "./App.css";

function App() {
  const [loading, setLoading] = useState(false);
  const [sendMessage, setSendMessage] = useState("");
  const [value, setValue] = useState<string>("");

  const onChangeSendMessage = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setSendMessage(value);
  };

  const onSend = async () => {
    if (loading) return;
    if (!sendMessage) return;
    setLoading(true);
    setValue("");

    const source = new EventSource(
      `http://localhost:4000/chat?msg=${encodeURIComponent(sendMessage)}`,
    );

    source.onmessage = (event) => {
      const parseData = JSON.parse(event.data);
      if (parseData?.choices?.[0]) {
        const data = parseData.choices[0];
        console.log(data);
        setValue((prev) => prev + data?.text || "");
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

  return (
    <div>
      <main>
        <div>{value}</div>
        <div style={{ display: "flex" }}>
          <textarea
            // type="text"
            value={sendMessage}
            onChange={onChangeSendMessage}
          />
          <button onClick={onSend}>전송</button>
        </div>
      </main>
    </div>
  );
}

export default App;
